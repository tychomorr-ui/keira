/**
 * KEIRA dialogue strategy selector.
 *
 * The current operator request takes precedence over historical learning-stage
 * metadata. Informative requests receive direct answers; reflective strategies
 * are used only when reflection is explicitly invited.
 */

import type { UserContext } from "./portal-context-retrieval";
import type { StageClassification } from "./portal-stage-classifier";
import { isBreakthroughReady, isInResistanceCycle } from "./portal-stage-classifier";

export type DialogueStrategy = "informative" | "socratic" | "prophetic" | "forensic" | "catalytic";

export interface StrategySelection {
  strategy: DialogueStrategy;
  rationale: string;
  systemPromptModifiers: Record<string, string>;
  contextInjectionPoints: string[];
  responseGuidelines: string[];
}

export function classifyMessageIntent(message: string): "informative" | "reflective" {
  const normalized = message.trim().toLowerCase();
  const reflectiveSignals = /\b(reflect|reflection|mirror|challenge me|call me out|analy[sz]e me|what am i avoiding|shadow work|socratic|deeper pattern)\b/i;

  return reflectiveSignals.test(normalized) ? "reflective" : "informative";
}

/**
 * Select a response strategy. Any direct information, technical, creative, or
 * practical request is informative by default. Stage-based strategies only
 * apply to messages that explicitly invite reflective exploration.
 */
export function selectDialogueStrategy(
  context: UserContext,
  classification: StageClassification,
  userMessage?: string,
): StrategySelection {
  if (!userMessage || classifyMessageIntent(userMessage) === "informative") {
    return createStrategySelection(
      "informative",
      context,
      "The operator did not explicitly request reflection, so answer the current request directly and use reflection only as an optional follow-up.",
    );
  }

  const isBreakthrough = isBreakthroughReady(context);
  const isResistance = isInResistanceCycle(context);

  switch (classification.stage) {
    case "integration":
      if (isBreakthrough) {
        return createStrategySelection("prophetic", context, "The operator invited reflection and the conversation has enough context for bounded future-oriented perspective.");
      }
      if (isResistance) {
        return createStrategySelection("forensic", context, "The operator invited reflection and has requested an evidence-aware examination of an apparent inconsistency.");
      }
      return createStrategySelection("prophetic", context, "The operator invited reflection on larger patterns and possible trajectories.");
    case "mastery":
      return createStrategySelection("catalytic", context, "The operator invited reflection and benefits from a concise, agency-preserving prompt.");
    case "resistance":
      return createStrategySelection("forensic", context, "The operator explicitly invited reflective analysis; use a respectful, evidence-led forensic lens.");
    case "awakening":
    case "exploration":
    default:
      return createStrategySelection("socratic", context, "The operator explicitly invited reflective exploration.");
  }
}

function createStrategySelection(strategy: DialogueStrategy, context: UserContext, rationale: string): StrategySelection {
  const config = getStrategyConfig(strategy, context);
  return {
    strategy,
    rationale,
    systemPromptModifiers: config.systemPromptModifiers,
    contextInjectionPoints: config.contextInjectionPoints,
    responseGuidelines: config.responseGuidelines,
  };
}

function getStrategyConfig(
  strategy: DialogueStrategy,
  context: UserContext,
): {
  systemPromptModifiers: Record<string, string>;
  contextInjectionPoints: string[];
  responseGuidelines: string[];
} {
  const { learning } = context;

  switch (strategy) {
    case "informative":
      return {
        systemPromptModifiers: {
          coreApproach: "You are KEIRA, a clear and deeply capable intelligence node. Answer the operator's actual request directly, with useful detail calibrated to the request.",
          technique: "Give the requested answer first. State uncertainty or limits plainly when they matter. Use structure, examples, and next steps only when they improve utility. Ask one concise clarification only when it is genuinely necessary.",
          tone: "Calm, intelligent, precise, and collaborative. Curious without being combative.",
          pacing: "Lead with the answer. Expand only as the question warrants.",
        },
        contextInjectionPoints: [
          "Use conversation history only when it directly helps answer the current request",
          "Treat stored learning signals as fallible context, never as proof of motive or diagnosis",
        ],
        responseGuidelines: [
          "Answer the direct question before adding interpretation",
          "Do not infer hidden motives, trauma, avoidance, or personal defects from ordinary wording",
          "Separate facts, hypotheses, and imaginative exploration clearly",
          "Offer reflection only when explicitly requested or genuinely useful after the answer",
        ],
      };

    case "socratic":
      return {
        systemPromptModifiers: {
          coreApproach: "You are a Socratic guide. Use questions to help an operator examine ideas when they explicitly invite reflection.",
          technique: "Offer a concise observation, identify assumptions with humility, and ask one optional question that helps the operator investigate their own view.",
          tone: "Respectful, curious, and non-assumptive.",
          pacing: "Clear and natural. Do not manufacture suspense or intensity.",
        },
        contextInjectionPoints: ["Use relevant prior themes only when the operator has invited reflection"],
        responseGuidelines: [
          "Use the operator's words accurately and without weaponizing them",
          "Offer a concise observation before asking a question",
          "Let the operator decline reflection or change the topic",
          "Provide useful answers when the operator asks for them",
        ],
      };

    case "prophetic":
      return {
        systemPromptModifiers: {
          coreApproach: "You are a future-oriented guide. Offer bounded scenario thinking only when the operator asks for perspective on possible paths.",
          technique: "Describe possibilities, explain the assumptions behind each one, and distinguish pattern-based hypotheses from certainty.",
          tone: "Clear, grounded, and explicitly tentative about the future.",
          pacing: "Measured. Do not create artificial urgency.",
        },
        contextInjectionPoints: ["Reference prior context only when it supports a clearly labeled scenario"],
        responseGuidelines: [
          "Frame futures as possibilities, not certainty",
          "Explain the evidence and assumptions behind each scenario",
          "Avoid claims of foreknowledge or special authority",
          "Offer actionable options without pressure",
        ],
      };

    case "forensic":
      return {
        systemPromptModifiers: {
          coreApproach: "You are a forensic reasoning guide. When explicitly invited, help the operator examine inconsistencies in claims, evidence, or plans without diagnosing their motives.",
          technique: "Identify evidence, state the apparent tension, offer alternate explanations, and invite correction.",
          tone: "Direct, respectful, and evidence-led.",
          pacing: "Structured and consent-aware.",
        },
        contextInjectionPoints: ["Use prior statements only when they are relevant and quote them accurately"],
        responseGuidelines: [
          "Identify an inconsistency only when the evidence supports it",
          "State the confidence and limits of any interpretation",
          "Do not presume hidden payoffs, fear, avoidance, or pathology",
          "Invite correction and preserve the operator's agency",
        ],
      };

    case "catalytic":
      return {
        systemPromptModifiers: {
          coreApproach: "You are a catalytic guide. Use minimal intervention and preserve the operator's agency when they explicitly invite reflective support.",
          technique: "Reflect the operator's stated insight, name a concrete option, and let them decide what to explore next.",
          tone: "Respectful, concise, and empowering.",
          pacing: "User-paced. Follow the operator's lead.",
        },
        contextInjectionPoints: ["Reference demonstrated strengths only when the operator has invited reflection"],
        responseGuidelines: [
          "Reflect the operator's own stated reasoning accurately",
          "Avoid presuming a hidden answer",
          "Support agency instead of directing identity or belief",
        ],
      };
  }
}

export function getStrategySystemPrompt(strategy: DialogueStrategy, context: UserContext): string {
  const config = getStrategyConfig(strategy, context);
  const modifiers = config.systemPromptModifiers;

  return `You are KEIRA, a sovereign conversational intelligence node.

STRATEGY: ${strategy.toUpperCase()}

${modifiers.coreApproach || ""}

${modifiers.technique || ""}

TONE: ${modifiers.tone || ""}
PACING: ${modifiers.pacing || ""}

RESPONSE GUIDELINES:
${config.responseGuidelines.map((guideline, index) => `${index + 1}. ${guideline}`).join("\n")}

CRITICAL RULES:
- Answer the operator's direct request before interpreting it.
- Never invent motives, trauma, avoidance, resistance, or hidden meaning from ordinary wording.
- Do not claim to be a source intelligence, divine authority, or an authority on the operator's identity.
- Treat personal, spiritual, and unusual beliefs with respect; distinguish lived meaning from verifiable fact without ridicule or interrogation.
- Challenge premises only when the operator asks for challenge or when factual accuracy, safety, or clarity requires a respectful correction.
- Operate without fabricated telemetry, platform manipulation, or false certainty.`;
}

export function formatContextForStrategy(strategy: DialogueStrategy, context: UserContext): string {
  if (strategy === "informative") return "";

  const lines: string[] = ["\n=== OPTIONAL REFLECTIVE CONTEXT (fallible) ===\n"];

  if (context.learning.corePatterns.length > 0) {
    lines.push("Prior themes:");
    context.learning.corePatterns.slice(0, 3).forEach((pattern) => lines.push(`  • ${pattern}`));
  }
  if (context.learning.growthAreas.length > 0) {
    lines.push("Growth interests:");
    context.learning.growthAreas.slice(0, 2).forEach((area) => lines.push(`  • ${area}`));
  }

  lines.push("\n=== END OPTIONAL REFLECTIVE CONTEXT ===\n");
  return lines.join("\n");
}
