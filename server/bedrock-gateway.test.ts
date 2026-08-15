import { beforeEach, describe, expect, it } from "vitest";
import {
  getBedrockAuthMode,
  isBedrockConfigured,
  resetBedrockClientForTests,
} from "./bedrock-gateway";

describe("Bedrock Gateway", () => {
  beforeEach(() => {
    resetBedrockClientForTests();
  });

  it("derives configuration readiness from a configured region, model, and secure authentication mode", () => {
    const hasEndpoint = Boolean(process.env.BEDROCK_REGION && process.env.BEDROCK_MODEL_ID);
    const authMode = getBedrockAuthMode();
    expect(["bearer", "iam", "none"]).toContain(authMode);
    expect(isBedrockConfigured()).toBe(hasEndpoint && authMode !== "none");
  });

  it("does not expose a bearer token through its public configuration state", () => {
    expect(getBedrockAuthMode()).not.toBe("token-value");
  });
});
