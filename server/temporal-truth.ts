export type TemporalStatus = "CURRENT" | "HISTORICAL" | "SUPERSEDED" | "EXPIRED" | "FUTURE_VALID" | "TEMPORALLY_UNKNOWN" | "TEMPORALLY_CONFLICTED";

export type TemporalEvidence = {
  validFrom?: string | null;
  validUntil?: string | null;
  observedAt?: string | null;
  ingestedAt?: string | null;
  sourcePublishedAt?: string | null;
  supersedes?: string | null;
  supersededBy?: string | null;
};

export type TemporalAssessment = {
  status: TemporalStatus;
  evaluatedAt: string;
  basis: string[];
};

function date(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function assessTemporalEvidence(evidence: TemporalEvidence, asOf = new Date()): TemporalAssessment {
  const evaluatedAt = asOf.toISOString();
  const now = asOf.getTime();
  const from = date(evidence.validFrom);
  const until = date(evidence.validUntil);
  const basis: string[] = [];
  if (evidence.validFrom && from === null) basis.push("validFrom is not a valid timestamp");
  if (evidence.validUntil && until === null) basis.push("validUntil is not a valid timestamp");
  if (from !== null && until !== null && from > until) return { status: "TEMPORALLY_CONFLICTED", evaluatedAt, basis: [...basis, "validFrom is later than validUntil"] };
  if (evidence.supersededBy) return { status: "SUPERSEDED", evaluatedAt, basis: [...basis, `supersededBy=${evidence.supersededBy}`] };
  if (until !== null && now > until) return { status: "EXPIRED", evaluatedAt, basis: [...basis, `validUntil=${evidence.validUntil}`] };
  if (from !== null && now < from) return { status: "FUTURE_VALID", evaluatedAt, basis: [...basis, `validFrom=${evidence.validFrom}`] };
  if (from !== null || until !== null) return { status: "CURRENT", evaluatedAt, basis: [...basis, "validity interval contains evaluation time"] };
  if (evidence.observedAt || evidence.sourcePublishedAt || evidence.ingestedAt) {
    const observed = date(evidence.observedAt) ?? date(evidence.sourcePublishedAt) ?? date(evidence.ingestedAt);
    if (observed !== null && observed < now) return { status: "HISTORICAL", evaluatedAt, basis: [...basis, "only an earlier observation/publication/ingestion time is available"] };
  }
  return { status: "TEMPORALLY_UNKNOWN", evaluatedAt, basis: [...basis, "no trustworthy validity interval is available"] };
}

export function isEvidenceUsableAt(assessment: TemporalAssessment, allowHistorical = false): boolean {
  return assessment.status === "CURRENT" || (allowHistorical && assessment.status === "HISTORICAL");
}
