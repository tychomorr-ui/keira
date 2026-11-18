export type EntailmentClassification = "ENTAILED" | "PARTIALLY_ENTAILED" | "CONTRADICTED" | "INSUFFICIENT_EVIDENCE" | "IRRELEVANT_EVIDENCE" | "AMBIGUOUS" | "UNVERIFIED";

export type EntailmentEvaluation = {
  claim: string;
  evidenceIds: string[];
  classification: EntailmentClassification;
  supportingSpans: string[];
  contradictingSpans: string[];
  confidence: "high" | "medium" | "low" | "unavailable";
  uncertainty: string[];
  method: "DETERMINISTIC_EXACT" | "DETERMINISTIC_STRUCTURAL" | "LOCAL_EVALUATOR" | "UNAVAILABLE";
  evaluatorVersion: string;
};

export type EntailmentPassage = { id: string; text: string };
export type LocalEntailmentEvaluator = (claim: string, passages: EntailmentPassage[]) => Promise<Partial<EntailmentEvaluation> & { classification: EntailmentClassification }>;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\[cid:[^\]]+\]/gi, "").replace(/[^a-z0-9.:%_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function proposition(value: string): string {
  return normalize(value).replace(/[.?!]+$/g, "").replace(/\s+/g, " ").trim();
}

function terms(value: string): Set<string> {
  return new Set(normalize(value).split(" ").filter((term) => term.length >= 4));
}

function numbers(value: string): string[] {
  return normalize(value).replace(/\bcid\s*[-_:]?\s*\S+/gi, "").match(/\b\d+(?:\.\d+)?%?\b/g) ?? [];
}

function negated(value: string): boolean {
  return /\b(?:not|never|no|without|cannot|can't|doesn't|isn't|aren't|didn't)\b/i.test(value);
}

function deterministicEvaluation(claim: string, passages: EntailmentPassage[]): EntailmentEvaluation {
  const normalizedClaim = proposition(claim);
  if (!passages.length) return { claim, evidenceIds: [], classification: "INSUFFICIENT_EVIDENCE", supportingSpans: [], contradictingSpans: [], confidence: "unavailable", uncertainty: ["No evidence passage was supplied."], method: "UNAVAILABLE", evaluatorVersion: "deterministic-1" };
  const claimNumbers = numbers(claim);
  const claimTerms = terms(claim);
  const scored = passages.map((passage) => {
    const passageTerms = terms(passage.text);
    const shared = Array.from(claimTerms).filter((term) => passageTerms.has(term)).length;
    const overlap = claimTerms.size ? shared / claimTerms.size : 0;
    const numericMismatch = claimNumbers.length > 0 && claimNumbers.some((value) => !numbers(passage.text).includes(value));
    const polarityConflict = negated(claim) !== negated(passage.text) && overlap >= 0.45;
    return { passage, overlap, numericMismatch, polarityConflict };
  }).sort((left, right) => right.overlap - left.overlap);
  const best = scored[0]!;
  if (proposition(best.passage.text).includes(normalizedClaim) || normalizedClaim.includes(proposition(best.passage.text))) return { claim, evidenceIds: [best.passage.id], classification: "ENTAILED", supportingSpans: [best.passage.text], contradictingSpans: [], confidence: "high", uncertainty: ["Exact text correspondence is not semantic proof beyond the supplied passage."], method: "DETERMINISTIC_EXACT", evaluatorVersion: "deterministic-1" };
  if (best.numericMismatch || best.polarityConflict) return { claim, evidenceIds: [best.passage.id], classification: "CONTRADICTED", supportingSpans: [], contradictingSpans: [best.passage.text], confidence: "medium", uncertainty: [best.numericMismatch ? "Claim numeric values do not match the cited passage." : "Claim and passage have conflicting negation polarity."], method: "DETERMINISTIC_STRUCTURAL", evaluatorVersion: "deterministic-1" };
  if (best.overlap >= 0.55) return { claim, evidenceIds: [best.passage.id], classification: "PARTIALLY_ENTAILED", supportingSpans: [best.passage.text], contradictingSpans: [], confidence: "low", uncertainty: ["Lexical/structural correspondence is insufficient to establish full semantic entailment."], method: "DETERMINISTIC_STRUCTURAL", evaluatorVersion: "deterministic-1" };
  if (best.overlap > 0) return { claim, evidenceIds: [best.passage.id], classification: "AMBIGUOUS", supportingSpans: [], contradictingSpans: [], confidence: "low", uncertainty: ["Evidence is related but does not establish the proposition."], method: "DETERMINISTIC_STRUCTURAL", evaluatorVersion: "deterministic-1" };
  return { claim, evidenceIds: [], classification: "IRRELEVANT_EVIDENCE", supportingSpans: [], contradictingSpans: [], confidence: "low", uncertainty: ["No substantive correspondence was found."], method: "DETERMINISTIC_STRUCTURAL", evaluatorVersion: "deterministic-1" };
}

export async function evaluateEntailment(claim: string, passages: EntailmentPassage[], evaluator?: LocalEntailmentEvaluator): Promise<EntailmentEvaluation> {
  const deterministic = deterministicEvaluation(claim, passages);
  if (!evaluator || deterministic.classification === "CONTRADICTED" || deterministic.classification === "INSUFFICIENT_EVIDENCE") return deterministic;
  try {
    const evaluated = await evaluator(claim, passages);
    return { ...deterministic, ...evaluated, claim, evidenceIds: evaluated.evidenceIds ?? deterministic.evidenceIds, method: "LOCAL_EVALUATOR", evaluatorVersion: evaluated.evaluatorVersion ?? "local-evaluator-unknown" };
  } catch {
    return { ...deterministic, classification: "UNVERIFIED", confidence: "unavailable", uncertainty: [...deterministic.uncertainty, "Local semantic evaluator failed or returned unusable output."], method: "UNAVAILABLE" };
  }
}
