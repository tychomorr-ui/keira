import { createHash, randomUUID } from "node:crypto";

export type XoriaProfile = "FAST" | "DEEP" | "SOVEREIGN";
export type XoriaDimension = "SUB_META" | "MICRO" | "META_MATA" | "MACRO" | "MEGA_MAGA" | "MULTI" | "OMNI";
export type BranchStatus = "COMPLETED" | "FAILED" | "TIMED_OUT" | "SKIPPED";

export type XoriaContext = Readonly<{
  requestId: string;
  correlationId: string;
  contextVersion: number;
  request: string;
  evidenceRefs: readonly string[];
  constraints: readonly string[];
  authorizationScope: string;
  deadlineAt: number;
  profile: XoriaProfile;
}>;

export type XoriaBranchResult = {
  branchId: string;
  dimension: XoriaDimension;
  status: BranchStatus;
  durationMs: number;
  contextVersion: number;
  payload: string;
  evidenceRefs: string[];
  uncertainties: string[];
  error?: string;
};

export type XoriaConvergence = {
  requestId: string;
  correlationId: string;
  contextVersion: number;
  profile: XoriaProfile;
  branches: XoriaBranchResult[];
  requiredDimensions: XoriaDimension[];
  unresolvedDimensions: XoriaDimension[];
  uncertainties: string[];
  outcome: "CONVERGED" | "PARTIAL" | "FAILED";
  finalResult: string;
};

const PROFILE_DIMENSIONS: Record<XoriaProfile, XoriaDimension[]> = {
  FAST: ["SUB_META", "MICRO"],
  DEEP: ["SUB_META", "MICRO", "META_MATA", "MACRO", "MULTI"],
  SOVEREIGN: ["SUB_META", "MICRO", "META_MATA", "MACRO", "MEGA_MAGA", "MULTI"],
};

function boundedProfile(profile: XoriaProfile | undefined): XoriaProfile {
  return profile === "FAST" || profile === "SOVEREIGN" ? profile : "DEEP";
}

function deadlineError(context: XoriaContext): string | null {
  return Date.now() >= context.deadlineAt ? "XORIA_DEADLINE_EXCEEDED" : null;
}

function defaultBranch(dimension: XoriaDimension, context: XoriaContext): { payload: string; uncertainties: string[] } {
  const evidence = context.evidenceRefs.length;
  const uncertainty = evidence ? [] : ["No evidence references were supplied to this branch."];
  const payloads: Record<XoriaDimension, string> = {
    SUB_META: `Validated governing constraints for request ${context.requestId}; authority scope is ${context.authorizationScope}.`,
    MICRO: `Inspected ${evidence} supplied evidence reference(s); no truth claim was promoted from identifiers alone.`,
    META_MATA: "Bounded reflection selected; no recursive model call was required.",
    MACRO: "No longitudinal system telemetry was supplied; system-level conclusions remain bounded.",
    MEGA_MAGA: "Ecosystem implications remain unverified without declared cross-system evidence.",
    MULTI: "Independent perspectives were reconciled without assigning authority to any branch.",
    OMNI: "OMNI preserves branch uncertainty and does not override evidence or authorization.",
  };
  return { payload: payloads[dimension], uncertainties: uncertainty };
}

async function runBranch(dimension: XoriaDimension, context: XoriaContext, handler?: (dimension: XoriaDimension, context: XoriaContext) => Promise<string>): Promise<XoriaBranchResult> {
  const started = Date.now();
  const branchId = `${dimension.toLowerCase()}-${randomUUID()}`;
  const deadline = deadlineError(context);
  if (deadline) return { branchId, dimension, status: "TIMED_OUT", durationMs: Date.now() - started, contextVersion: context.contextVersion, payload: "", evidenceRefs: [], uncertainties: [deadline], error: deadline };
  try {
    const payload = handler ? await handler(dimension, context) : defaultBranch(dimension, context).payload;
    const timedOut = deadlineError(context);
    if (timedOut) return { branchId, dimension, status: "TIMED_OUT", durationMs: Date.now() - started, contextVersion: context.contextVersion, payload: "", evidenceRefs: [...context.evidenceRefs], uncertainties: [timedOut], error: timedOut };
    return { branchId, dimension, status: "COMPLETED", durationMs: Date.now() - started, contextVersion: context.contextVersion, payload, evidenceRefs: [...context.evidenceRefs], uncertainties: defaultBranch(dimension, context).uncertainties };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { branchId, dimension, status: "FAILED", durationMs: Date.now() - started, contextVersion: context.contextVersion, payload: "", evidenceRefs: [], uncertainties: ["Branch failed; result was not promoted."], error: message };
  }
}

export async function runXoriaPlan(input: {
  request: string;
  profile?: XoriaProfile;
  evidenceRefs?: string[];
  constraints?: string[];
  authorizationScope?: string;
  timeoutMs?: number;
  handler?: (dimension: XoriaDimension, context: XoriaContext) => Promise<string>;
}): Promise<XoriaConvergence> {
  const profile = boundedProfile(input.profile);
  const requestId = randomUUID();
  const correlationId = createHash("sha256").update(`${requestId}:${input.request}`).digest("hex").slice(0, 32);
  const context: XoriaContext = Object.freeze({
    requestId,
    correlationId,
    contextVersion: 1,
    request: input.request,
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
    constraints: Object.freeze([...(input.constraints ?? ["model output does not grant authority", "failed branches are not completed"])]),
    authorizationScope: input.authorizationScope ?? "none",
    deadlineAt: Date.now() + Math.max(1, Math.min(30_000, Math.floor(input.timeoutMs ?? 2_000))),
    profile,
  });
  const requiredDimensions = PROFILE_DIMENSIONS[profile];
  const branches = await Promise.all(requiredDimensions.map((dimension) => runBranch(dimension, context, input.handler)));
  const completed = branches.filter((branch) => branch.status === "COMPLETED");
  const unresolvedDimensions = branches.filter((branch) => branch.status !== "COMPLETED").map((branch) => branch.dimension);
  const uncertainties = branches.flatMap((branch) => branch.uncertainties);
  const finalResult = completed.length
    ? completed.map((branch) => `[${branch.dimension}] ${branch.payload}`).join("\n")
    : "XORIA convergence failed: no branch completed.";
  const outcome = completed.length === requiredDimensions.length ? "CONVERGED" : completed.length ? "PARTIAL" : "FAILED";
  return { requestId, correlationId, contextVersion: context.contextVersion, profile, branches, requiredDimensions: [...requiredDimensions], unresolvedDimensions, uncertainties: Array.from(new Set(uncertainties)), outcome, finalResult };
}
