import { describe, expect, it } from "vitest";
import {
  DEFAULT_KEIRA_MODEL_ID,
  KEIRA_MODEL_OPTIONS,
  isKeiraModelId,
  resolveKeiraModelId,
} from "./keira-models";

describe("KEIRA model allow-list", () => {
  it("exposes exactly the verified Kimi and DeepSeek model choices", () => {
    expect(KEIRA_MODEL_OPTIONS.map((model) => model.id)).toEqual([
      "moonshotai.kimi-k2.5",
      "deepseek.v3.2",
    ]);
  });

  it("rejects arbitrary model IDs and resolves missing values to the tested Kimi default", () => {
    expect(isKeiraModelId("arbitrary-model")).toBe(false);
    expect(resolveKeiraModelId("arbitrary-model")).toBe(DEFAULT_KEIRA_MODEL_ID);
    expect(resolveKeiraModelId("deepseek.v3.2")).toBe("deepseek.v3.2");
  });
});
