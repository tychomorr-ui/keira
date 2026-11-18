import { describe, expect, it } from "vitest";
import { evaluateEntailment } from "./semantic-entailment";
import { gateResponseWithSemanticEvaluation } from "./evidence-gate";

describe("semantic entailment", () => {
  it("recognizes exact correspondence without overstating it as universal truth", async () => {
    const result = await evaluateEntailment("The runtime uses deterministic retrieval.", [{ id: "cid-1", text: "The runtime uses deterministic retrieval." }]);
    expect(result.classification).toBe("ENTAILED");
    expect(result.method).toBe("DETERMINISTIC_EXACT");
  });

  it("classifies numeric mismatch as contradiction", async () => {
    const result = await evaluateEntailment("The store has 768 dimensions.", [{ id: "cid-1", text: "The store has 384 dimensions." }]);
    expect(result.classification).toBe("CONTRADICTED");
  });

  it("preserves ambiguity instead of promoting related evidence", async () => {
    const result = await evaluateEntailment("The runtime is production-authorized.", [{ id: "cid-1", text: "The runtime is reachable and configured." }]);
    expect(["AMBIGUOUS", "PARTIALLY_ENTAILED", "IRRELEVANT_EVIDENCE"]).toContain(result.classification);
  });

  it("marks evaluator failure as unverified", async () => {
    const result = await evaluateEntailment("The runtime uses retrieval.", [{ id: "cid-1", text: "The runtime uses retrieval." }], async () => { throw new Error("evaluator unavailable"); });
    expect(result.classification).toBe("UNVERIFIED");
    expect(result.method).toBe("UNAVAILABLE");
  });

  it("maps semantic classifications into the existing Evidence Gate contract", async () => {
    const result = await gateResponseWithSemanticEvaluation(
      "The runtime uses deterministic retrieval [CID: cid-1].",
      [{ cid: "cid-1", snippet: "The runtime uses deterministic retrieval." }],
    );
    expect(result.status).toBe("SUPPORTED");
    expect(result.claims[0]?.semantic?.classification).toBe("ENTAILED");
  });
});
