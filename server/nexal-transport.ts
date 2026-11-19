import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NexalInbox, type NexalEvent, type NexalReceipt } from "./nexal-fabric";

function canonical(event: NexalEvent): string { return JSON.stringify({ ...event, provenance: [...event.provenance] }); }
export function signNexalEvent(event: NexalEvent, secret: string): string { return createHmac("sha256", secret).update(canonical(event)).digest("hex"); }
export function verifyNexalEvent(event: NexalEvent, signature: string, secret: string): boolean {
  const expected = Buffer.from(signNexalEvent(event, secret), "hex"); const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function sendNexalEvent(event: NexalEvent, endpoint: string, sharedSecret: string, fetchImpl: typeof fetch = fetch): Promise<NexalReceipt> {
  const response = await fetchImpl(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-nexal-signature": signNexalEvent(event, sharedSecret) }, body: canonical(event) });
  const body = await response.json() as NexalReceipt;
  if (!response.ok) throw new Error(`NEXAL transport failed with HTTP ${response.status}`);
  return body;
}

export function createNexalHttpReceiver(inbox: NexalInbox, sharedSecret: string) {
  return async function receive(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    try {
      const event = JSON.parse(Buffer.concat(chunks).toString("utf8")) as NexalEvent;
      const signature = String(req.headers["x-nexal-signature"] ?? "");
      if (!verifyNexalEvent(event, signature, sharedSecret)) { res.statusCode = 401; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ state: "INVALID", acknowledged: false, reason: "NEXAL signature verification failed", eventId: event.eventId })); return; }
      const receipt = inbox.receive(event); res.statusCode = receipt.state === "RECEIVED" || receipt.state === "DUPLICATE" ? 200 : 409; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(receipt));
    } catch { res.statusCode = 400; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ state: "INVALID", acknowledged: false, reason: "invalid NEXAL request", eventId: "unknown" })); }
  };
}
