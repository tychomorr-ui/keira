import type { IntegrityState } from "./historical-integrity";
import type { SovereignLifecycleState } from "./sovereign-state";
import type { EntailmentClassification } from "./semantic-entailment";
import type { TemporalStatus } from "./temporal-truth";

export type OmniBranch = { id: string; status: "COMPLETED" | "FAILED" | "TIMED_OUT" | "UNRESOLVED"; uncertainty?: string[] };
export type OmniClaim = { id: string; semantic: EntailmentClassification; integrity: IntegrityState; temporal: TemporalStatus };
export type OmniInput = { requestId: string; correlationId: string; contextVersion: number; branches: OmniBranch[]; claims: OmniClaim[]; ssoState: SovereignLifecycleState; authorization: "AUTHORIZED" | "UNAUTHORIZED" | "UNKNOWN"; recommendationOnly?: boolean };
export type OmniConvergence = { requestId: string; correlationId: string; contextVersion: number; outcome: "RELEASE" | "RELEASE_WITH_UNCERTAINTY" | "BLOCKED"; releaseEligible: boolean; unresolvedDimensions: string[]; uncertainty: string[]; authorizationRequired: boolean; reason: string };

export function convergeOmni(input: OmniInput): OmniConvergence {
  const unresolvedDimensions: string[] = [];
  const uncertainty: string[] = [];
  const failedBranches = input.branches.filter((branch) => branch.status !== "COMPLETED");
  if (failedBranches.length) {
    unresolvedDimensions.push(...failedBranches.map((branch) => `branch:${branch.id}`));
    uncertainty.push(...failedBranches.flatMap((branch) => branch.uncertainty ?? [`${branch.id} did not complete`]));
  }
  for (const claim of input.claims) {
    if (claim.semantic !== "ENTAILED") unresolvedDimensions.push(`semantic:${claim.id}`);
    if (claim.integrity === "INTEGRITY_FAILED") unresolvedDimensions.push(`integrity:${claim.id}`);
    if (claim.integrity !== "CRYPTOGRAPHIC_VERIFIED") uncertainty.push(`integrity for ${claim.id} is ${claim.integrity}`);
    if (claim.temporal !== "CURRENT") { unresolvedDimensions.push(`temporal:${claim.id}`); uncertainty.push(`temporal state for ${claim.id} is ${claim.temporal}`); }
  }
  if (input.authorization !== "AUTHORIZED") { unresolvedDimensions.push("authorization"); uncertainty.push("model output and convergence cannot grant authority"); }
  if (input.ssoState !== "POSTCONDITION-VERIFIED" && input.ssoState !== "EXECUTED") uncertainty.push(`SSO lifecycle is ${input.ssoState}`);
  if (input.recommendationOnly) uncertainty.push("recommendation is not an execution authorization");
  const blocked = input.authorization === "UNAUTHORIZED" || input.claims.some((claim) => claim.semantic === "CONTRADICTED" || claim.integrity === "INTEGRITY_FAILED");
  const releaseEligible = !blocked && unresolvedDimensions.length === 0;
  return { requestId: input.requestId, correlationId: input.correlationId, contextVersion: input.contextVersion, outcome: blocked ? "BLOCKED" : releaseEligible ? "RELEASE" : "RELEASE_WITH_UNCERTAINTY", releaseEligible, unresolvedDimensions: Array.from(new Set(unresolvedDimensions)), uncertainty: Array.from(new Set(uncertainty)), authorizationRequired: input.authorization !== "AUTHORIZED", reason: blocked ? "OMNI blocked release because authorization or integrity/contradiction invariants failed." : releaseEligible ? "All supplied release invariants passed." : "OMNI preserved unresolved dimensions; release is not fully verified." };
}
