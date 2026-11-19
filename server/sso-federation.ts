import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { SovereignStateObject, SovereignLifecycleState } from "./sovereign-state";

export type SsoReport = { reportId: string; nodeId: string; correlationId: string; state: SovereignLifecycleState; operationalState: SovereignStateObject["operationalState"]; contextVersion: number; issuedAt: string; nonce: string; provenance: string[]; signature: string };
export type SsoApplyResult = { accepted: boolean; reason: string; state?: SovereignStateObject };

function payload(report: Omit<SsoReport, "signature">): string {
  return JSON.stringify({ reportId: report.reportId, nodeId: report.nodeId, correlationId: report.correlationId, state: report.state, operationalState: report.operationalState, contextVersion: report.contextVersion, issuedAt: report.issuedAt, nonce: report.nonce, provenance: [...report.provenance] });
}
export function signSsoReport(report: Omit<SsoReport, "signature">, secret: string): string { return createHmac("sha256", secret).update(payload(report)).digest("hex"); }
export function createSsoReport(input: Omit<SsoReport, "reportId" | "issuedAt" | "signature">, secret: string): SsoReport {
  const unsigned = { ...input, reportId: cryptoRandomId(), issuedAt: new Date().toISOString() }; return { ...unsigned, signature: signSsoReport(unsigned, secret) };
}
function cryptoRandomId(): string { return randomUUID(); }
export function verifySsoReport(report: SsoReport, secret: string, now = Date.now(), maxAgeMs = 5 * 60_000): boolean {
  const age = now - Date.parse(report.issuedAt); if (!Number.isFinite(age) || age < -60_000 || age > maxAgeMs) return false;
  const expected = Buffer.from(signSsoReport({ reportId: report.reportId, nodeId: report.nodeId, correlationId: report.correlationId, state: report.state, operationalState: report.operationalState, contextVersion: report.contextVersion, issuedAt: report.issuedAt, nonce: report.nonce, provenance: report.provenance }, secret), "hex"); const received = Buffer.from(report.signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export class SsoFederationReceiver {
  private readonly nonces = new Set<string>();
  constructor(private readonly localNodeId: string, private readonly sharedSecret: string, private readonly currentContextVersion: number) {}
  apply(report: SsoReport, state: SovereignStateObject, now = Date.now()): SsoApplyResult {
    if (report.nodeId === this.localNodeId) return { accepted: false, reason: "self-originated SSO report rejected" };
    if (!verifySsoReport(report, this.sharedSecret, now)) return { accepted: false, reason: "SSO signature or freshness verification failed" };
    if (this.nonces.has(report.nonce)) return { accepted: false, reason: "SSO report nonce already consumed" };
    this.nonces.add(report.nonce);
    if (report.contextVersion < this.currentContextVersion) return { accepted: false, reason: "SSO report context is stale" };
    if (report.state === "AUTHORIZED" || report.state === "EXECUTED" || report.state === "POSTCONDITION-VERIFIED") return { accepted: false, reason: "remote SSO report cannot grant local authority or execution" };
    return { accepted: true, reason: "remote SSO observation accepted without granting authority", state: { ...state, operationalState: report.operationalState, evidenceState: "REMOTE_SSO_OBSERVED", temporalState: "CURRENT", provenance: [...state.provenance, `sso:${report.reportId}`, ...report.provenance], timestamp: new Date().toISOString() } };
  }
}
