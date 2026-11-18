import { describe, expect, it } from "vitest";
import { runXoriaPlan } from "./xoria-fabric";
import { assessTemporalEvidence, isEvidenceUsableAt } from "./temporal-truth";

describe("XORIA bounded execution fabric", () => {
  it("runs FAST with only mandatory low-cost dimensions", async () => {
    const result = await runXoriaPlan({ request: "status", profile: "FAST", evidenceRefs: ["cid:1"] });
    expect(result.outcome).toBe("CONVERGED");
    expect(result.requiredDimensions).toEqual(["SUB_META", "MICRO"]);
    expect(result.branches.every((branch) => branch.contextVersion === 1)).toBe(true);
  });

  it("runs DEEP branches concurrently and converges structured output", async () => {
    const started: string[] = [];
    const result = await runXoriaPlan({
      request: "analyze architecture",
      profile: "DEEP",
      handler: async (dimension) => { started.push(dimension); await new Promise((resolve) => setTimeout(resolve, 5)); return `${dimension}-result`; },
    });
    expect(result.outcome).toBe("CONVERGED");
    expect(started).toHaveLength(5);
    expect(result.finalResult).toContain("[META_MATA] META_MATA-result");
  });

  it("does not promote failed branches to completed results", async () => {
    const result = await runXoriaPlan({
      request: "secure operation",
      profile: "SOVEREIGN",
      handler: async (dimension) => { if (dimension === "MICRO") throw new Error("evidence unavailable"); return `${dimension}-result`; },
    });
    expect(result.outcome).toBe("PARTIAL");
    expect(result.unresolvedDimensions).toContain("MICRO");
    expect(result.branches.find((branch) => branch.dimension === "MICRO")?.status).toBe("FAILED");
  });
});

describe("Temporal Truth", () => {
  const asOf = new Date("2026-01-01T00:00:00.000Z");
  it("classifies current, historical, future, expired, and superseded evidence", () => {
    expect(assessTemporalEvidence({ validFrom: "2025-01-01", validUntil: "2027-01-01" }, asOf).status).toBe("CURRENT");
    expect(assessTemporalEvidence({ observedAt: "2025-01-01" }, asOf).status).toBe("HISTORICAL");
    expect(assessTemporalEvidence({ validFrom: "2027-01-01" }, asOf).status).toBe("FUTURE_VALID");
    expect(assessTemporalEvidence({ validUntil: "2025-12-31" }, asOf).status).toBe("EXPIRED");
    expect(assessTemporalEvidence({ supersededBy: "cid:new" }, asOf).status).toBe("SUPERSEDED");
  });

  it("does not treat unknown temporal data as current", () => {
    const assessment = assessTemporalEvidence({}, asOf);
    expect(assessment.status).toBe("TEMPORALLY_UNKNOWN");
    expect(isEvidenceUsableAt(assessment)).toBe(false);
  });
});
