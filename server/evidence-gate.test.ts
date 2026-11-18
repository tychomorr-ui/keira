import { describe, expect, it } from "vitest";
import { validateEvidenceGate } from "./evidence-gate";

const evidence = [
  { cid: "cid-runtime", snippet: "The local runtime uses deterministic retrieval and a 768-dimensional embedding store." },
  { cid: "cid-policy", snippet: "Capability is not authority. Proposed actions require authorization before execution." },
];

describe("Evidence Gate", () => {
  it("supports a cited proposition with passage correspondence", () => {
    const result = validateEvidenceGate("The local runtime uses deterministic retrieval [CID: cid-runtime].", evidence);
    expect(result.status).toBe("SUPPORTED");
    expect(result.supportedCount).toBe(1);
    expect(result.claims[0]?.status).toBe("SUPPORTED");
  });

  it("does not promote a real but irrelevant CID", () => {
    const result = validateEvidenceGate("The system uses Byzantine fault tolerant consensus [CID: cid-runtime].", evidence);
    expect(result.status).toBe("UNSUPPORTED");
    expect(result.claims[0]?.status).toBe("UNSUPPORTED");
    expect(result.claims[0]?.reason).toContain("lexical passage correspondence");
  });

  it("marks absent citations as unsupported", () => {
    const result = validateEvidenceGate("The system has an autonomous consensus layer.", evidence);
    expect(result.claims[0]?.status).toBe("UNSUPPORTED");
    expect(result.response).toContain("Evidence Gate: UNSUPPORTED");
  });

  it("marks citations outside the retrieved evidence set as unverified", () => {
    const result = validateEvidenceGate("The runtime is deployed in Singapore [CID: cid-missing].", evidence);
    expect(result.claims[0]?.status).toBe("UNVERIFIED");
  });

  it("reports no corpus match without inventing support", () => {
    const result = validateEvidenceGate("Explain an absent subsystem in detail.", []);
    expect(result.status).toBe("NO_CORPUS_MATCH");
    expect(result.corpusMatch).toBe(false);
  });

  it("preserves supported and unsupported claims separately", () => {
    const result = validateEvidenceGate(
      "Capability is not authority [CID: cid-policy]. The system uses Byzantine fault tolerant consensus [CID: cid-runtime].",
      evidence,
    );
    expect(result.status).toBe("PARTIALLY_SUPPORTED");
    expect(result.supportedCount).toBe(1);
    expect(result.unresolvedCount).toBe(1);
  });
});
