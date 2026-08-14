import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> } {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies.push({ name, value, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

describe("auth.ownerBootstrap", () => {
  it("accepts the configured private owner token and establishes a session", async () => {
    const token = process.env.PORTAL_OWNER_ACCESS_TOKEN;
    expect(token).toBeTruthy();

    const { ctx, cookies } = createContext();
    const user = await appRouter.createCaller(ctx).auth.ownerBootstrap({ token: token! });

    expect(user.role).toBe("admin");
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toBeTruthy();
  });
});
