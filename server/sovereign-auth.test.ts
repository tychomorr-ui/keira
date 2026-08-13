import { describe, expect, it } from "vitest";

describe("sovereign authentication primitives", () => {
  it("hashes passwords without allowing plaintext recovery", async () => {
    const { hashPassword, verifyPassword } = await import("./sovereign-auth");
    const password = "correct horse battery staple";
    const stored = await hashPassword(password);

    expect(stored).not.toContain(password);
    expect(await verifyPassword(password, stored)).toBe(true);
    expect(await verifyPassword("wrong password", stored)).toBe(false);
  });

  it("round-trips a first-party session token and rejects tampering", async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "local-test-secret";
    const { createSessionToken, verifySessionToken } = await import("./sovereign-auth");
    const token = await createSessionToken({ userId: 42, name: "Sovereign Operator" });

    expect(await verifySessionToken(token)).toEqual({ userId: 42, name: "Sovereign Operator" });
    expect(await verifySessionToken(`${token}tampered`)).toBeNull();
  });
});
