/**
 * The only model IDs that KEIRA currently exposes to an operator. Keeping the
 * list here makes the UI, persistence layer, and Bedrock invocation boundary
 * share one explicit and auditable allow-list.
 */
export const KEIRA_MODEL_OPTIONS = [
  {
    id: "moonshotai.kimi-k2.5",
    label: "Kimi K2.5",
    description: "Primary conversational model",
  },
  {
    id: "deepseek.v3.2",
    label: "DeepSeek V3.2",
    description: "Alternative reasoning model",
  },
] as const;

export type KeiraModelId = (typeof KEIRA_MODEL_OPTIONS)[number]["id"];

export const DEFAULT_KEIRA_MODEL_ID: KeiraModelId = "moonshotai.kimi-k2.5";

export function isKeiraModelId(value: unknown): value is KeiraModelId {
  return KEIRA_MODEL_OPTIONS.some((model) => model.id === value);
}

export function resolveKeiraModelId(value: unknown): KeiraModelId {
  return isKeiraModelId(value) ? value : DEFAULT_KEIRA_MODEL_ID;
}
