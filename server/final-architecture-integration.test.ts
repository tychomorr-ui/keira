import { describe, expect, it, vi } from "vitest";
import { runHydraSearch } from "./hydra-search";
import { gateResponseWithSemanticEvaluation } from "./evidence-gate";
import { runXoriaPlan } from "./xoria-fabric";
import { beginPerformanceSpan, getPerformanceSnapshot, resetPerformanceSamples } from "./performance-fabric";

vi.mock("./local-embedding-provider", () => ({
  generateEmbedding: vi.fn(async () => Array(768).fill(0.02)),
}));

describe("connected KEIRA/XORIA lifecycle", () => {
  it("preserves evidence identity, temporal state, validation, convergence, and measurements", async () => {
    resetPerformanceSamples();
    const total = beginPerformanceSpan("TOTAL_REQUEST");
    const rows = [{
      artifactCid: "cid-current",
      filename: "runtime.md",
      content: "The local runtime uses deterministic retrieval.",
      vectorJson: JSON.stringify(Array(768).fill(0.02)),
      contentSha256: null,
      temporal: { validFrom: "2025-01-01T00:00:00.000Z", validUntil: "2027-01-01T00:00:00.000Z" },
    }];
    const retrieval = await runHydraSearch(rows, "local runtime", { currentOnly: true, asOf: new Date("2026-01-01T00:00:00.000Z") });
    const cid = retrieval.fusion[0]?.id;
    expect(cid).toBe("cid-current");
    expect(retrieval.temporal[cid!]?.status).toBe("CURRENT");
    const validation = await gateResponseWithSemanticEvaluation("The local runtime uses deterministic retrieval [CID: cid-current].", [{ cid: cid!, snippet: rows[0].content }]);
    expect(validation.status).toBe("SUPPORTED");
    const xoria = await runXoriaPlan({ request: "Explain the runtime", profile: "SOVEREIGN", evidenceRefs: [cid!], authorizationScope: "conversation-only" });
    expect(xoria.contextVersion).toBe(1);
    expect(xoria.branches.some((branch) => branch.status !== "COMPLETED")).toBe(false);
    total.finish(true);
    const performance = getPerformanceSnapshot();
    expect(performance.p50.TOTAL_REQUEST).not.toBeNull();
  });
});
