import { describe, expect, it } from "vitest";
import { extractEsotericKeywords, segmentEsotericText } from "../shared/esotericKeywords";

describe("esoteric keyword intelligence", () => {
  it("extracts curated and morphology-based terms without duplicates", () => {
    expect(extractEsotericKeywords("The Akashic field mirrors synchronicity and teleology."))
      .toEqual(["akashic", "synchronicity", "teleology"]);
  });

  it("segments multi-word esoteric phrases for inline highlighting", () => {
    expect(segmentEsotericText("Shadow work reveals the collective unconscious.")).toEqual([
      { text: "Shadow work", keyword: "shadow work" },
      { text: " reveals the ", keyword: null },
      { text: "collective unconscious", keyword: "collective unconscious" },
      { text: ".", keyword: null },
    ]);
  });
});
