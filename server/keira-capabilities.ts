import { getBedrockAuthMode, isBedrockConfigured } from "./bedrock-gateway";

export type KeiraCapabilityStatus = "available" | "awaiting-configuration" | "browser-dependent";

export type KeiraCapability = {
  id:
    | "reasoning"
    | "conversation-memory"
    | "context-ledger"
    | "transcript-export"
    | "voice"
    | "realtime-voice"
    | "research"
    | "personalization"
    | "response-calibration";
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
      id: "context-ledger",
      label: "Context ledger",
      status: "available",
      detail: "Operator-owned context entries can be reviewed, activated, paused, or removed before they influence future responses.",
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
      id: "realtime-voice",
      label: "Realtime voice",
      status: "awaiting-configuration",
      detail: "Natural low-latency interruption and streaming speech require a separately configured realtime voice provider; browser voice remains the current fallback.",
    },
    {
      id: "research",
      label: "Cited research",
      status: "awaiting-configuration",
      detail: "Research mode will activate only after a search provider and source-citation workflow are configured; model-only answers are not represented as live research.",
    },
    {
      id: "personalization",
      label: "Operator settings",
      status: "available",
      detail: "Persona, instructions, response calibration, avatar, and voice preferences can be stored per operator.",
    },
    {
      id: "response-calibration",
      label: "Response calibration",
      status: "available",
      detail: "The operator’s saved response-variation preference is applied to future server-side inference requests.",
    },
  ];
}
