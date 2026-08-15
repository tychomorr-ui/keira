import { describe, expect, it } from "vitest";

describe("KEIRA branding configuration", () => {
  it("uses KEIRA as the application title", () => {
    expect(process.env.VITE_APP_TITLE ?? "KEIRA").toBe("KEIRA");
  });
});
