import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { assessHistoricalIntegrity } from "./historical-integrity";
import { createNexalEvent, NexalInbox } from "./nexal-fabric";
import { convergeOmni } from "./omni-convergence";
import { createSovereignState, promoteSovereignState } from "./sovereign-state";

describe("historical integrity", () => {
  it("verifies preserved hashes without inventing missing hashes", () => {
    const content = "historical evidence";
    const hash = createHash("sha256").update(content).digest("hex");
    expect(assessHistoricalIntegrity({ artifactId: "a", content, preservedHash: hash }).state).toBe("CRYPTOGRAPHIC_VERIFIED");
    expect(assessHistoricalIntegrity({ artifactId: "b", content }).state).toBe("LEGACY_LEXICAL");
    expect(assessHistoricalIntegrity({ artifactId: "c", content: "changed", preservedHash: hash }).state).toBe("INTEGRITY_FAILED");
  });
});

describe("NEXAL local fabric", () => {
  it("accepts, acknowledges, and deduplicates events", () => {
    const inbox = new NexalInbox(2);
    const event = createNexalEvent({ eventType: "SSO_REPORT", correlationId: "corr", requestId: "req", sender: "keira", destination: "omni", contextVersion: 2, provenance: ["local"], authorizationContext: "observe-only", payload: { state: "HEALTH-VERIFIED" } });
    expect(inbox.receive(event).state).toBe("RECEIVED");
    expect(inbox.receive(event).state).toBe("DUPLICATE");
  });
  it("rejects stale context without executing anything", () => {
    const inbox = new NexalInbox(3);
    const event = createNexalEvent({ eventType: "GOAL_UPDATE", correlationId: "corr", requestId: "req", sender: "keira", destination: "omni", contextVersion: 2, provenance: [], authorizationContext: "none", payload: {} });
    expect(inbox.receive(event).state).toBe("STALE_CONTEXT");
    expect(inbox.list()).toHaveLength(0);
  });
});

describe("Sovereign State Objects", () => {
  it("requires evidence for promotion and distinguishes health from reachability", () => {
    const state = createSovereignState({ identity: "keira", component: "local-model", version: "1", operationalState: "NOT-PROBED", lifecycleState: "DECLARED", evidenceState: "UNKNOWN", integrityState: "UNVERIFIED", temporalState: "UNKNOWN", authorityState: "UNAUTHORIZED", dependencies: [], capabilities: ["generate"], constraints: ["local-only"], provenance: [] });
    expect(() => promoteSovereignState(state, "CONFIGURED", [])).toThrow();
    expect(() => promoteSovereignState(state, "HEALTH-VERIFIED", ["probe"])).toThrow();
    const configured = promoteSovereignState(state, "CONFIGURED", ["env-loaded"]);
    expect(configured.lifecycleState).toBe("CONFIGURED");
  });
});

describe("OMNI convergence", () => {
  const base = { requestId: "req", correlationId: "corr", contextVersion: 1, branches: [{ id: "xoria:omni", status: "COMPLETED" as const }], claims: [{ id: "claim-1", semantic: "ENTAILED" as const, integrity: "CRYPTOGRAPHIC_VERIFIED" as const, temporal: "CURRENT" as const }], ssoState: "EXECUTED" as const, authorization: "AUTHORIZED" as const };
  it("releases only when all supplied invariants pass", () => expect(convergeOmni(base).outcome).toBe("RELEASE"));
  it("preserves unresolved uncertainty without manufacturing consensus", () => {
    const result = convergeOmni({ ...base, authorization: "UNKNOWN", branches: [{ id: "xoria:micro", status: "TIMED_OUT", uncertainty: ["timeout"] }] });
    expect(result.outcome).toBe("RELEASE_WITH_UNCERTAINTY");
    expect(result.releaseEligible).toBe(false);
    expect(result.uncertainty).toContain("timeout");
  });
  it("blocks contradictory or integrity-failed claims", () => {
    const result = convergeOmni({ ...base, claims: [{ id: "claim-1", semantic: "CONTRADICTED", integrity: "INTEGRITY_FAILED", temporal: "CURRENT" }] });
    expect(result.outcome).toBe("BLOCKED");
    expect(result.releaseEligible).toBe(false);
  });
});
