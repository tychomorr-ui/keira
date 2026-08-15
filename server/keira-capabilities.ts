import { getBedrockAuthMode, isBedrockConfigured } from "./bedrock-gateway";

export type KeiraCapabilityStatus = "available" | "awaiting-configuration" | "browser-dependent";

export type KeiraCapability = {
  id: "reasoning" | "conversation-memory" | "transcript-export" | "voice" | "personalization";
  label: string;
  status: KeiraCapabilityStatus;
  detail: string;
};

/**
 * Non-sensitive, honest feature availability for the authenticated console.
 * This never exposes credentials, model IDs, bucket names, or infrastructure
 * topology.
 */
export function getKeiraCapabilities(): KeiraCapability[] {
  const bedrockReady = isBedrockConfigured();
  const authMode = getBedrockAuthMode();

  return [
    {
      id: "reasoning",
      label: "Bedrock reasoning",
      status: bedrockReady ? "available" : "awaiting-configuration",
      detail: bedrockReady
        ? `Server-side inference is configured through ${authMode === "bearer" ? "a bearer credential" : "IAM credentials"}.`
        : "Awaiting a configured Bedrock region, model, and server-side credential.",
    },
    {
      id: "conversation-memory",
      label: "Conversation continuity",
      status: "available",
      detail: "Threads, messages, and operator preferences are persisted in the application data store.",
    },
    {
      id: "transcript-export",
      label: "Transcript export",
      status: "available",
      detail: "The current conversation can be exported directly from the console as a local JSON transcript.",
    },
    {
      id: "voice",
      label: "Voice interaction",
      status: "browser-dependent",
      detail: "Speech input and output depend on the browser and locally installed voices; no synthetic voice availability is implied.",
    },
    {
      id: "personalization",
      label: "Operator settings",
      status: "available",
      detail: "Persona, instructions, response calibration, avatar, and voice preferences can be stored per operator.",
    },
  ];
}
