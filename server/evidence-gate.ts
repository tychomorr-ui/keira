import { createHash } from "node:crypto";
import { evaluateEntailment, type EntailmentEvaluation, type LocalEntailmentEvaluator } from "./semantic-entailment";

export type EvidenceGateStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "CONTRADICTED"
  | "UNVERIFIED"
  | "NO_CORPUS_MATCH";

export type EvidenceGateArtifact = {
  cid: string;
  snippet: string;
  contentSha256?: string | null;
};

export type EvidenceGateClaim = {
  claimId: string;
  claimText: string;
  citedCids: string[];
  status: EvidenceGateStatus;
  validationMethod: "CID_MEMBERSHIP_HASH_AND_LEXICAL_PASSAGE_CHECK" | "CID_MEMBERSHIP_AND_LEXICAL_PASSAGE_CHECK" | "NO_RETRIEVED_EVIDENCE";
  reason: string;
  semantic?: EntailmentEvaluation;
};

export type EvidenceGateResult = {
  response: string;
  claims: EvidenceGateClaim[];
  status: EvidenceGateStatus;
  supportedCount: number;
  unresolvedCount: number;
  corpusMatch: boolean;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "use", "uses", "with", "your",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9:_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function terms(value: string): string[] {
  return Array.from(new Set(normalize(value).split(" ").filter((term) => term.length >= 4 && !STOP_WORDS.has(term))));
}

function splitClaims(response: string): string[] {
  return response
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+(?=[A-Z\[])/)
    .map((claim) => claim.trim())
    .filter(Boolean);
}

function citedCids(claim: string): string[] {
  return Array.from(claim.matchAll(/\[CID:\s*([^\]]+)\]/gi), (match) => match[1]?.trim() ?? "").filter(Boolean);
}

function overlapScore(claim: string, snippet: string): number {
  const claimTerms = terms(claim);
  if (!claimTerms.length) return 0;
  const snippetTerms = new Set(terms(snippet));
  return claimTerms.filter((term) => snippetTerms.has(term)).length / claimTerms.length;
}

function hasNegation(value: string): boolean {
  return /\b(?:not|never|no|without|cannot|can't|doesn't|isn't|aren't|didn't)\b/i.test(value);
}

function hashMatches(artifact: EvidenceGateArtifact): boolean {
  if (!artifact.contentSha256) return true;
  return createHash("sha256").update(artifact.snippet, "utf8").digest("hex") === artifact.contentSha256.toLowerCase();
}

function isNonClaimLine(claim: string): boolean {
  return /^(?:#|\*\*|[-*•]|\d+[.)]|evidence gate:|core answer:|mechanism:|limitations?:|practical next steps?:|conclusion:)/i.test(claim.trim());
}

export function validateEvidenceGate(response: string, artifacts: EvidenceGateArtifact[]): EvidenceGateResult {
  const validArtifacts = artifacts.filter((artifact) => artifact.cid.trim() && artifact.snippet.trim());
  if (!validArtifacts.length) {
    return {
      response,
      claims: [],
      status: "NO_CORPUS_MATCH",
      supportedCount: 0,
      unresolvedCount: 0,
      corpusMatch: false,
    };
  }

  const artifactByCid = new Map(validArtifacts.map((artifact) => [normalize(artifact.cid), artifact]));
  const claims: EvidenceGateClaim[] = [];
  for (const [index, claimText] of Array.from(splitClaims(response).entries())) {
    if (isNonClaimLine(claimText) || claimText.length < 24) continue;
    const citations = citedCids(claimText);
    if (!citations.length) {
      claims.push({
        claimId: `claim-${index + 1}`,
        claimText,
        citedCids: [],
        status: "UNSUPPORTED",
        validationMethod: "CID_MEMBERSHIP_AND_LEXICAL_PASSAGE_CHECK",
        reason: "No retrieved artifact CID was attached to this factual-looking proposition.",
      });
      continue;
    }

    const resolved = citations.map((cid) => artifactByCid.get(normalize(cid))).filter((artifact): artifact is EvidenceGateArtifact => Boolean(artifact));
    if (resolved.length !== citations.length) {
      claims.push({
        claimId: `claim-${index + 1}`,
        claimText,
        citedCids: citations,
        status: "UNVERIFIED",
        validationMethod: "CID_MEMBERSHIP_AND_LEXICAL_PASSAGE_CHECK",
        reason: "One or more cited CIDs are not present in the authoritative retrieved evidence set.",
      });
      continue;
    }

    const integrityFailure = resolved.some((artifact) => !hashMatches(artifact));
    const contradiction = validArtifacts.some((artifact) => {
      if (resolved.includes(artifact) || overlapScore(claimText, artifact.snippet) < 0.35) return false;
      return hasNegation(claimText) !== hasNegation(artifact.snippet);
    });
    const bestOverlap = Math.max(...resolved.map((artifact) => overlapScore(claimText, artifact.snippet)));
    const status: EvidenceGateStatus = integrityFailure
      ? "UNVERIFIED"
      : contradiction
        ? "CONTRADICTED"
        : bestOverlap >= 0.2 ? "SUPPORTED" : bestOverlap > 0 ? "PARTIALLY_SUPPORTED" : "UNSUPPORTED";
    claims.push({
      claimId: `claim-${index + 1}`,
      claimText,
      citedCids: citations,
      status,
      validationMethod: resolved.some((artifact) => artifact.contentSha256)
        ? "CID_MEMBERSHIP_HASH_AND_LEXICAL_PASSAGE_CHECK"
        : "CID_MEMBERSHIP_AND_LEXICAL_PASSAGE_CHECK",
      reason: integrityFailure
        ? "The cited passage does not match its stored SHA-256 content identity."
        : contradiction
          ? "A retrieved passage with overlapping terms has conflicting negation polarity."
          : status === "SUPPORTED"
            ? "Cited CID exists and shares substantive terms with the cited passage."
            : "Cited CID exists, but lexical passage correspondence is insufficient to establish support.",
    });
  }

  const supportedCount = claims.filter((claim) => claim.status === "SUPPORTED").length;
  const unresolvedCount = claims.filter((claim) => claim.status !== "SUPPORTED").length;
  const status: EvidenceGateStatus = unresolvedCount === 0
    ? "SUPPORTED"
    : supportedCount > 0
      ? "PARTIALLY_SUPPORTED"
      : "UNSUPPORTED";
  const notice = unresolvedCount > 0
    ? `\n\nEvidence Gate: ${status}. ${unresolvedCount} factual-looking proposition(s) remain unresolved after CID membership and passage checks. Treat them as hypotheses, not verified corpus facts.`
    : "\n\nEvidence Gate: SUPPORTED. Cited propositions passed CID membership and lexical passage checks.";

  return { response: `${response.trim()}${notice}`, claims, status, supportedCount, unresolvedCount, corpusMatch: true };
}

export function gateResponse(response: string, artifacts: EvidenceGateArtifact[]): EvidenceGateResult {
  return validateEvidenceGate(response, artifacts);
}

export async function gateResponseWithSemanticEvaluation(
  response: string,
  artifacts: EvidenceGateArtifact[],
  evaluator?: LocalEntailmentEvaluator,
): Promise<EvidenceGateResult> {
  const base = validateEvidenceGate(response, artifacts);
  const byCid = new Map(artifacts.map((artifact) => [normalize(artifact.cid), artifact]));
  for (const claim of base.claims) {
    const passages = claim.citedCids.map((cid) => byCid.get(normalize(cid))).filter((artifact): artifact is EvidenceGateArtifact => Boolean(artifact)).map((artifact) => ({ id: artifact.cid, text: artifact.snippet }));
    claim.semantic = await evaluateEntailment(claim.claimText, passages, evaluator);
    if (claim.semantic.classification === "ENTAILED") claim.status = "SUPPORTED";
    else if (claim.semantic.classification === "PARTIALLY_ENTAILED") claim.status = "PARTIALLY_SUPPORTED";
    else if (claim.semantic.classification === "CONTRADICTED") claim.status = "CONTRADICTED";
    else if (claim.semantic.classification === "UNVERIFIED" || claim.semantic.classification === "AMBIGUOUS") claim.status = "UNVERIFIED";
    else if (claim.semantic.classification === "INSUFFICIENT_EVIDENCE" || claim.semantic.classification === "IRRELEVANT_EVIDENCE") claim.status = "UNSUPPORTED";
  }
  const supportedCount = base.claims.filter((claim) => claim.status === "SUPPORTED").length;
  const unresolvedCount = base.claims.filter((claim) => claim.status !== "SUPPORTED").length;
  const status: EvidenceGateStatus = !base.corpusMatch
    ? "NO_CORPUS_MATCH"
    : unresolvedCount === 0 ? "SUPPORTED" : supportedCount > 0 ? "PARTIALLY_SUPPORTED" : "UNSUPPORTED";
  const notice = !base.corpusMatch
    ? "\n\nEvidence Gate: NO_CORPUS_MATCH. No retrieved corpus evidence was available for semantic evaluation."
    : `\n\nEvidence Gate: ${status}. ${unresolvedCount} factual-looking proposition(s) remain unresolved after integrity and semantic evaluation.`;
  return { ...base, response: `${response.trim()}${notice}`, claims: base.claims, status, supportedCount, unresolvedCount };
}
