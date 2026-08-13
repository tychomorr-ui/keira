import { describe, expect, it } from "vitest";
import { initializecMAPSession, processcMAPMessage } from "./cmap-portal-integration";

describe("cMAP Session Isolation", () => {
  it("isolates mission state per conversation ID so threads do not leak intents", async () => {
    const sessionA = await initializecMAPSession(1);
    const sessionB = await initializecMAPSession(1);

    const updatedA = processcMAPMessage("Mission Alpha: Build sovereign rocket.", sessionA);
    const updatedB = processcMAPMessage("Mission Beta: Audit quantum ledger.", sessionB);

    expect(updatedA.missionState.missionIntent).toBe("Mission Alpha: Build sovereign rocket");
    expect(updatedB.missionState.missionIntent).toBe("Mission Beta: Audit quantum ledger");
    expect(updatedA.missionState.missionIntent).not.toBe(updatedB.missionState.missionIntent);
  });
});
