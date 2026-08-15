export const RESPONSE_OBJECTIVES = ["direct", "analysis", "creative", "plan"] as const;
export type ResponseObjective = (typeof RESPONSE_OBJECTIVES)[number];

export const CONTEXT_CARRYOVER_POLICIES = ["minimal", "standard", "extended"] as const;
export type ContextCarryoverPolicy = (typeof CONTEXT_CARRYOVER_POLICIES)[number];

const OBJECTIVE_CONTRACTS: Record<ResponseObjective, string> = {
  direct: [
    "Lead with the direct answer in plain language.",
    "Then separate supporting reasoning from assumptions or uncertainty.",
    "Offer one useful follow-up only when it materially helps.",
  ].join("\n"),
  analysis: [
    "Start with the working conclusion, then show the reasoning in a clear structure.",
    "Identify meaningful alternatives, trade-offs, and uncertainty instead of flattening them.",
    "Distinguish evidence, inference, and speculation explicitly.",
  ].join("\n"),
  creative: [
    "Generate original possibilities with strong stylistic range while staying responsive to the request.",
    "Clearly label invented examples, fictional material, and imaginative speculation.",
    "Do not present creative invention as researched fact or lived experience.",
  ].join("\n"),
  plan: [
    "Turn the request into an executable sequence with prerequisites, ordered actions, and verification points.",
    "Name material risks, dependencies, and what the operator must decide or provide.",
    "Prefer specific next steps over generic encouragement.",
  ].join("\n"),
};

export function resolveResponseObjective(value: unknown): ResponseObjective {
  return RESPONSE_OBJECTIVES.includes(value as ResponseObjective) ? value as ResponseObjective : "direct";
}

export function resolveContextCarryover(value: unknown): ContextCarryoverPolicy {
  return CONTEXT_CARRYOVER_POLICIES.includes(value as ContextCarryoverPolicy) ? value as ContextCarryoverPolicy : "standard";
}

export function getResponseObjectiveContract(value: unknown): string {
  return OBJECTIVE_CONTRACTS[resolveResponseObjective(value)];
}

export function getCarryoverMessageLimit(value: unknown): number {
  switch (resolveContextCarryover(value)) {
    case "minimal":
      return 2;
    case "extended":
      return 12;
    case "standard":
    default:
      return 6;
  }
}

export function getCarryoverDescription(value: unknown): string {
  switch (resolveContextCarryover(value)) {
    case "minimal":
      return "The two most recent prior messages are sent with the next request.";
    case "extended":
      return "The twelve most recent prior messages are sent with the next request.";
    case "standard":
    default:
      return "The six most recent prior messages are sent with the next request.";
  }
}
