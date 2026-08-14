import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./sovereign-auth";

describe("Sovereign Login & Session Persistence", () => {
  it("creates and verifies valid session tokens without requiring repeated sign-in", async () => {
    const token = await createSessionToken({ userId: 777, name: "Tyler Morris" });
    const verified = await verifySessionToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(777);
    expect(verified?.name).toBe("Tyler Morris");
  });
});
