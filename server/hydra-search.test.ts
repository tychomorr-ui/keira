import { describe, expect, it, vi } from "vitest";

vi.mock("./local-embedding-provider", () => ({
  generateEmbedding: vi.fn(async (text: string) => Array.from({ length: 768 }, (_, index) => (text.length + index % 11) / 1000)),
}));

import { buildHydraRewriteQueries, runHydraSearch } from "./hydra-search";

describe("Hydra retrieval", () => {
  const rows = [
    { artifactCid: "cid-policy", filename: "policy.md", content: "Capability is not authority.", vectorJson: JSON.stringify(Array(768).fill(0.02)) },
    { artifactCid: "cid-runtime", filename: "runtime.md", content: "The local runtime uses deterministic retrieval.", vectorJson: JSON.stringify(Array(768).fill(0.03)) },
    { artifactCid: "cid-noise", filename: "unrelated.md", content: "A separate archival note.", vectorJson: JSON.stringify(Array(768).fill(0.01)) },
  ];

  it("creates bounded deterministic rewrites without external generation", () => {
    const rewrites = buildHydraRewriteQueries("How does the local runtime work?");
    expect(rewrites.length).toBeGreaterThan(0);
    expect(rewrites.length).toBeLessThanOrEqual(3);
    expect(rewrites[0]).toBe("How does the local runtime work?");
    expect(rewrites.join(" ")).not.toContain("invented");
  });

  it("returns keyword, dense, rewrite, metadata, and fused heads with real source ids", async () => {
    const result = await runHydraSearch(rows, "local runtime", { limit: 2 });
    expect(result.heads.keyword.length).toBeGreaterThan(0);
    expect(result.heads.dense).toHaveLength(3);
    expect(result.heads.rewrite.length).toBeGreaterThan(0);
    expect(result.heads.metadata.length).toBeGreaterThan(0);
    expect(result.fusion).toHaveLength(2);
    expect(result.fusion.every((entry) => rows.some((row) => row.artifactCid === entry.id))).toBe(true);
    expect(result.fusion[0]?.score).toBeGreaterThan(0);
  });

  it("is stable for identical inputs", async () => {
    const first = await runHydraSearch(rows, "capability authority", { limit: 3 });
    const second = await runHydraSearch(rows, "capability authority", { limit: 3 });
    expect(second).toEqual(first);
  });

  it("filters superseded and expired evidence for current-only retrieval while preserving temporal status", async () => {
    const temporalRows = [
      { ...rows[0], temporal: { validUntil: "2025-12-31T00:00:00.000Z" } },
      { ...rows[1], temporal: { validFrom: "2025-01-01T00:00:00.000Z", validUntil: "2027-01-01T00:00:00.000Z" } },
      { ...rows[2], temporal: { supersededBy: "cid-newer" } },
    ];
    const result = await runHydraSearch(temporalRows, "local runtime", { currentOnly: true, asOf: new Date("2026-01-01T00:00:00.000Z"), limit: 3 });
    expect(result.temporal["cid-policy"]?.status).toBe("EXPIRED");
    expect(result.temporal["cid-noise"]?.status).toBe("SUPERSEDED");
    expect(result.fusion.map((entry) => entry.id)).not.toContain("cid-policy");
    expect(result.fusion.map((entry) => entry.id)).not.toContain("cid-noise");
    expect(result.fusion.map((entry) => entry.id)).toContain("cid-runtime");
  });
});
