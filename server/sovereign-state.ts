export type SovereignLifecycleState = "DECLARED" | "CONFIGURED" | "AVAILABLE" | "HEALTH-VERIFIED" | "AUTHORIZED" | "EXECUTED" | "POSTCONDITION-VERIFIED";
export type HonestOperationalState = "STANDBY" | "UNAVAILABLE" | "NOT-PROBED" | "UNVERIFIED" | "PENDING" | "OFFLINE";
export type SovereignStateObject = { identity: string; component: string; version: string; operationalState: HonestOperationalState; lifecycleState: SovereignLifecycleState; evidenceState: string; integrityState: string; temporalState: string; authorityState: string; dependencies: string[]; capabilities: string[]; constraints: string[]; timestamp: string; provenance: string[] };

const order: SovereignLifecycleState[] = ["DECLARED", "CONFIGURED", "AVAILABLE", "HEALTH-VERIFIED", "AUTHORIZED", "EXECUTED", "POSTCONDITION-VERIFIED"];

export function createSovereignState(input: Omit<SovereignStateObject, "timestamp">): SovereignStateObject { return { ...input, timestamp: new Date().toISOString() }; }
export function promoteSovereignState(state: SovereignStateObject, next: SovereignLifecycleState, evidence: string[]): SovereignStateObject {
  const currentIndex = order.indexOf(state.lifecycleState); const nextIndex = order.indexOf(next);
  if (nextIndex < currentIndex) throw new Error("SSO state cannot move backwards");
  if (nextIndex > currentIndex && evidence.length === 0) throw new Error("SSO promotion requires evidence");
  if (next === "HEALTH-VERIFIED" && state.operationalState === "NOT-PROBED") throw new Error("reachability is not health");
  if (next === "AUTHORIZED" && state.authorityState === "UNAUTHORIZED") throw new Error("authorization evidence is required");
  return { ...state, lifecycleState: next, provenance: [...state.provenance, ...evidence, `promoted:${next}`], timestamp: new Date().toISOString() };
}
