import { describe, expect, it } from "vitest";
import { isValidOwnerAccessToken } from "./sovereign-auth";

describe("Custom Owner Key Validation", () => {
  it("validates owner access tokens correctly", () => {
    expect(typeof isValidOwnerAccessToken).toBe("function");
    expect(isValidOwnerAccessToken("")).toBe(false);
  });
});
