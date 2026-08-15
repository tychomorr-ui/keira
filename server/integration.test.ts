import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Portal-only API surface", () => {
  it("mounts sovereign authentication and Portal chat procedures", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("auth.me");
    expect(procedures).toContain("portal.chat.getConversations");
    expect(procedures).toContain("portal.chat.getCapabilities");
    expect(procedures).toContain("portal.chat.getContextLedger");
    expect(procedures).toContain("portal.chat.addContextLedgerEntry");
    expect(procedures).toContain("portal.chat.setContextLedgerEntryActive");
    expect(procedures).toContain("portal.chat.deleteContextLedgerEntry");
  });

  it("does not mount legacy Mirror, knowledge graph, subscription, or platform-system procedures", () => {
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures.some((path) => path.startsWith("mirror."))).toBe(false);
    expect(procedures.some((path) => path.startsWith("kg."))).toBe(false);
    expect(procedures.some((path) => path.startsWith("subscription."))).toBe(false);
    expect(procedures.some((path) => path.startsWith("system."))).toBe(false);
  });
});
