import { randomUUID } from "node:crypto";

export type NexalEventType = "SSO_REPORT" | "OPTIMIZATION_DIRECTIVE" | "ANOMALY_ALERT" | "GOAL_UPDATE" | "CONSTRAINT_BROADCAST" | "HEALING_SIGNAL";
export type DeliveryState = "RECEIVED" | "DUPLICATE" | "REPLAY_REJECTED" | "STALE_CONTEXT" | "INVALID";
export type NexalEvent<T = unknown> = { eventId: string; eventType: NexalEventType; correlationId: string; requestId: string; sender: string; destination: string; schemaVersion: 1; timestamp: string; contextVersion: number; provenance: string[]; authorizationContext: string; payload: T };
export type NexalReceipt = { eventId: string; state: DeliveryState; acknowledged: boolean; reason: string };

const validTypes = new Set<NexalEventType>(["SSO_REPORT", "OPTIMIZATION_DIRECTIVE", "ANOMALY_ALERT", "GOAL_UPDATE", "CONSTRAINT_BROADCAST", "HEALING_SIGNAL"]);

export function createNexalEvent<T>(input: Omit<NexalEvent<T>, "eventId" | "timestamp" | "schemaVersion">): NexalEvent<T> {
  return { ...input, eventId: randomUUID(), timestamp: new Date().toISOString(), schemaVersion: 1 };
}

export class NexalInbox {
  private readonly seen = new Set<string>();
  private readonly accepted = new Map<string, NexalEvent>();
  constructor(private readonly currentContextVersion = 1) {}
  receive(event: NexalEvent): NexalReceipt {
    if (!validTypes.has(event.eventType) || event.schemaVersion !== 1 || !event.sender || !event.destination) return { eventId: event.eventId, state: "INVALID", acknowledged: false, reason: "event schema or identity is invalid" };
    if (this.seen.has(event.eventId)) return { eventId: event.eventId, state: "DUPLICATE", acknowledged: true, reason: "event ID was already received; no second delivery occurred" };
    this.seen.add(event.eventId);
    if (event.contextVersion < this.currentContextVersion) return { eventId: event.eventId, state: "STALE_CONTEXT", acknowledged: false, reason: "event context version is older than the inbox context" };
    if (event.timestamp > new Date(Date.now() + 60_000).toISOString()) return { eventId: event.eventId, state: "REPLAY_REJECTED", acknowledged: false, reason: "event timestamp is outside the accepted future clock window" };
    this.accepted.set(event.eventId, Object.freeze({ ...event }));
    return { eventId: event.eventId, state: "RECEIVED", acknowledged: true, reason: "event accepted locally; message authentication does not grant execution authority" };
  }
  get(eventId: string): NexalEvent | undefined { return this.accepted.get(eventId); }
  list(): NexalEvent[] { return Array.from(this.accepted.values()).map((event) => ({ ...event })); }
}
