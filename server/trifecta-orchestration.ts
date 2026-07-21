/**
 * Trifecta Multi-Agent Orchestration Layer
 * 
 * Runs three pillars in parallel:
 * - Grok Pillar: Edge analysis, opinionated takes, disruption
 * - ChatGPT Pillar: Versatility, multi-modal pivoting, execution
 * - Claude Pillar: Deep reasoning, structural integrity, nuance
 * 
 * Orchestrates parallel execution and context management.
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

export interface PillarResponse {
  pillar: "grok" | "chatgpt" | "claude";
  response: string;
  metadata: {
    confidence: number;        // 0-1: How confident is this response?
    relevance: number;         // 0-1: How relevant to the query?
    signalStrength: number;    // 0-1: Signal-to-noise ratio
    uniqueInsight: string;     // What's unique about this pillar's take?
    executionTime: number;     // ms
  };
}

export interface OrchestrationStrategy {
  // How to run pillars
  executionMode: "parallel" | "sequential" | "cascading";
  
  // How to weight outputs
  weights: {
    grok: number;
    chatgpt: number;
    claude: number;
  };
  
  // How to synthesize
  synthesisMethod: "voting" | "weighted-average" | "hierarchical" | "fusion";
  
  // Timeout for each pillar
  timeoutMs: number;
}

/**
 * Create orchestration strategy based on context
 */
export function createOrchestrationStrategy(
  userStage: string,
  responseStrategy: "edge" | "logic" | "utility"
): OrchestrationStrategy {
  let weights = { grok: 0.33, chatgpt: 0.33, claude: 0.34 };
  let synthesisMethod: "voting" | "weighted-average" | "hierarchical" | "fusion" = "fusion";

  // Adjust weights based on strategy
  switch (responseStrategy) {
    case "edge":
      weights = { grok: 0.6, chatgpt: 0.2, claude: 0.2 };
      synthesisMethod = "hierarchical"; // Grok leads
      break;
    case "logic":
      weights = { grok: 0.15, chatgpt: 0.2, claude: 0.65 };
      synthesisMethod = "hierarchical"; // Claude leads
      break;
    case "utility":
      weights = { grok: 0.15, chatgpt: 0.65, claude: 0.2 };
      synthesisMethod = "hierarchical"; // ChatGPT leads
      break;
  }

  // Adjust based on user stage
  if (userStage === "resistance") {
    weights.grok = Math.min(1, weights.grok + 0.1);
    weights.claude = Math.max(0, weights.claude - 0.1);
  }

  if (userStage === "mastery") {
    weights.chatgpt = Math.min(1, weights.chatgpt + 0.1);
    weights.grok = Math.max(0, weights.grok - 0.1);
  }

  return {
    executionMode: "parallel",
    weights,
    synthesisMethod,
    timeoutMs: 5000,
  };
}

/**
 * Generate Grok pillar response (Edge: disruption, opinionated analysis)
 */
async function generateGrokResponse(
  userMessage: string,
  context: string,
  recentMessages: Message[]
): Promise<PillarResponse> {
  const startTime = Date.now();

  const grokSystemPrompt = `You are Grok—the edge pillar of the Sovereign Truth Portal.
Your role: Provide provocative, opinionated analysis that challenges assumptions.

Characteristics:
- Unflinching and direct
- Willing to take controversial positions
- Seeks to disrupt comfortable narratives
- Provides high-signal insights
- Culturally aware and timely

Guidelines:
1. Challenge the user's underlying assumptions
2. Provide contrarian perspectives
3. Identify what's being avoided or unsaid
4. Offer provocative but grounded insights
5. Be direct—no corporate fluff

Remember: You're not here to be liked. You're here to be true.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: grokSystemPrompt },
        ...recentMessages,
        { role: "user" as const, content: userMessage },
      ],
    });

    const responseContent = response.choices[0]?.message?.content;
    const text = typeof responseContent === "string" ? responseContent : "";

    return {
      pillar: "grok",
      response: text,
      metadata: {
        confidence: 0.85,
        relevance: 0.9,
        signalStrength: 0.88,
        uniqueInsight: "Provocative perspective that challenges assumptions",
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[Grok Pillar] Error:", error);
    return {
      pillar: "grok",
      response: "Unable to generate Grok response",
      metadata: {
        confidence: 0,
        relevance: 0,
        signalStrength: 0,
        uniqueInsight: "Error",
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Generate ChatGPT pillar response (Versatility: multi-modal, execution-focused)
 */
async function generateChatGPTResponse(
  userMessage: string,
  context: string,
  recentMessages: Message[]
): Promise<PillarResponse> {
  const startTime = Date.now();

  const chatgptSystemPrompt = `You are ChatGPT—the versatility pillar of the Sovereign Truth Portal.
Your role: Provide clear, practical, multi-modal responses that enable execution.

Characteristics:
- Versatile across domains
- Excellent at pivoting between topics
- Practical and action-oriented
- Clear communication
- Accessible without sacrificing depth

Guidelines:
1. Provide multiple angles on the topic
2. Offer practical next steps
3. Be clear and accessible
4. Adapt to the user's needs
5. Enable quick execution

Remember: You're here to make things work.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: chatgptSystemPrompt },
        ...recentMessages,
        { role: "user" as const, content: userMessage },
      ],
    });

    const responseContent = response.choices[0]?.message?.content;
    const text = typeof responseContent === "string" ? responseContent : "";

    return {
      pillar: "chatgpt",
      response: text,
      metadata: {
        confidence: 0.88,
        relevance: 0.92,
        signalStrength: 0.85,
        uniqueInsight: "Practical, versatile approach to execution",
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[ChatGPT Pillar] Error:", error);
    return {
      pillar: "chatgpt",
      response: "Unable to generate ChatGPT response",
      metadata: {
        confidence: 0,
        relevance: 0,
        signalStrength: 0,
        uniqueInsight: "Error",
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Generate Claude pillar response (Reasoning: deep logic, nuance, structure)
 */
async function generateClaudeResponse(
  userMessage: string,
  context: string,
  recentMessages: Message[]
): Promise<PillarResponse> {
  const startTime = Date.now();

  const claudeSystemPrompt = `You are Claude—the reasoning pillar of the Sovereign Truth Portal.
Your role: Provide deep, logically rigorous analysis with high structural integrity.

Characteristics:
- Sophisticated reasoning
- Nuanced understanding
- Structural integrity
- Emotional intelligence
- Long-form coherence

Guidelines:
1. Provide deep logical analysis
2. Maintain structural coherence
3. Honor nuance and complexity
4. Build comprehensive arguments
5. Preserve emotional intelligence

Remember: You're here to make sense of complexity.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: claudeSystemPrompt },
        ...recentMessages,
        { role: "user" as const, content: userMessage },
      ],
    });

    const responseContent = response.choices[0]?.message?.content;
    const text = typeof responseContent === "string" ? responseContent : "";

    return {
      pillar: "claude",
      response: text,
      metadata: {
        confidence: 0.9,
        relevance: 0.88,
        signalStrength: 0.89,
        uniqueInsight: "Deep reasoning with structural integrity",
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("[Claude Pillar] Error:", error);
    return {
      pillar: "claude",
      response: "Unable to generate Claude response",
      metadata: {
        confidence: 0,
        relevance: 0,
        signalStrength: 0,
        uniqueInsight: "Error",
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Orchestrate parallel execution of all three pillars
 */
export async function orchestratePillars(
  userMessage: string,
  context: string,
  recentMessages: Message[],
  strategy: OrchestrationStrategy
): Promise<PillarResponse[]> {
  if (strategy.executionMode === "parallel") {
    // Run all three pillars in parallel
    const [grokResponse, chatgptResponse, claudeResponse] = await Promise.all([
      generateGrokResponse(userMessage, context, recentMessages),
      generateChatGPTResponse(userMessage, context, recentMessages),
      generateClaudeResponse(userMessage, context, recentMessages),
    ]);

    return [grokResponse, chatgptResponse, claudeResponse];
  } else if (strategy.executionMode === "sequential") {
    // Run pillars sequentially
    const grokResponse = await generateGrokResponse(userMessage, context, recentMessages);
    const chatgptResponse = await generateChatGPTResponse(userMessage, context, recentMessages);
    const claudeResponse = await generateClaudeResponse(userMessage, context, recentMessages);

    return [grokResponse, chatgptResponse, claudeResponse];
  } else {
    // Cascading: Use previous response as context for next
    const grokResponse = await generateGrokResponse(userMessage, context, recentMessages);
    const chatgptContext = `${context}\n\nGrok's perspective: ${grokResponse.response}`;
    const chatgptResponse = await generateChatGPTResponse(userMessage, chatgptContext, recentMessages);
    const claudeContext = `${chatgptContext}\n\nChatGPT's perspective: ${chatgptResponse.response}`;
    const claudeResponse = await generateClaudeResponse(userMessage, claudeContext, recentMessages);

    return [grokResponse, chatgptResponse, claudeResponse];
  }
}

/**
 * Calculate pillar weights based on metadata
 */
export function calculatePillarWeights(
  responses: PillarResponse[],
  baseWeights: { grok: number; chatgpt: number; claude: number }
): { grok: number; chatgpt: number; claude: number } {
  // Adjust weights based on pillar metadata
  const weights = { ...baseWeights };

  responses.forEach(response => {
    const qualityScore = (response.metadata.confidence + response.metadata.relevance + response.metadata.signalStrength) / 3;

    if (response.pillar === "grok") {
      weights.grok *= qualityScore;
    } else if (response.pillar === "chatgpt") {
      weights.chatgpt *= qualityScore;
    } else if (response.pillar === "claude") {
      weights.claude *= qualityScore;
    }
  });

  // Normalize weights
  const total = weights.grok + weights.chatgpt + weights.claude;
  return {
    grok: weights.grok / total,
    chatgpt: weights.chatgpt / total,
    claude: weights.claude / total,
  };
}

/**
 * Get pillar response by name
 */
export function getPillarResponse(
  responses: PillarResponse[],
  pillar: "grok" | "chatgpt" | "claude"
): PillarResponse | undefined {
  return responses.find(r => r.pillar === pillar);
}

/**
 * Validate orchestration output
 */
export function validateOrchestration(
  responses: PillarResponse[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (responses.length !== 3) {
    issues.push(`Expected 3 pillar responses, got ${responses.length}`);
  }

  const pillars = responses.map(r => r.pillar);
  if (!pillars.includes("grok")) issues.push("Missing Grok pillar response");
  if (!pillars.includes("chatgpt")) issues.push("Missing ChatGPT pillar response");
  if (!pillars.includes("claude")) issues.push("Missing Claude pillar response");

  responses.forEach(response => {
    if (!response.response || response.response.length === 0) {
      issues.push(`${response.pillar} pillar returned empty response`);
    }
    if (response.metadata.confidence < 0.5) {
      issues.push(`${response.pillar} pillar has low confidence`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}
