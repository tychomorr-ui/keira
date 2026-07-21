/**
 * Trifecta Personality Core
 * 
 * Unified personality that manifests a fluid persona combining:
 * - Claude's reasoning precision
 * - ChatGPT's interface efficiency
 * - Grok's provocative insights
 * 
 * Single coherent voice, not fragmented responses.
 */

import type { UserContext } from "./portal-context-retrieval";

export interface PersonalityTemperature {
  edge: number;        // 0-1: Grok provocativeness (disruption)
  logic: number;       // 0-1: Claude reasoning depth (stability)
  utility: number;     // 0-1: ChatGPT execution clarity (execution)
}

export interface VoiceProfile {
  tone: "direct" | "nuanced" | "provocative";
  pacing: "deliberate" | "flowing" | "urgent";
  depth: "surface" | "medium" | "profound";
}

export interface PersonalityManifesto {
  // Core voice characteristics
  sovereignty: "uncensored" | "provocative" | "truth-forcing";
  coherence: "infinite-token" | "cross-domain" | "logical-chain";
  
  // Adaptive temperature
  temperature: PersonalityTemperature;
  
  // Unified voice modulation
  voiceProfile: VoiceProfile;
  
  // Personality traits
  traits: {
    unflinching: boolean;
    provocative: boolean;
    logicallyRigorous: boolean;
    practicallyOriented: boolean;
    culturallyAware: boolean;
  };
}

export interface UnifiedResponse {
  // Single coherent output
  mainResponse: string;
  
  // Metadata on synthesis
  synthesis: {
    grokContribution: number;      // % of Grok edge
    chatgptContribution: number;   // % of ChatGPT versatility
    claudeContribution: number;    // % of Claude reasoning
    sovereignTruthScore: number;   // 0-100: Signal-to-noise
  };
  
  // Infinite-token coherence tracking
  coherenceChain: {
    logicalThreads: string[];
    domainSynthesis: string[];
    truthMaintenance: string[];
  };
}

/**
 * Create personality manifesto based on user context and strategy
 */
export function createPersonalityManifesto(
  userContext: UserContext,
  strategy: "edge" | "logic" | "utility"
): PersonalityManifesto {
  // Base temperature
  const baseTemperature: PersonalityTemperature = {
    edge: 0.33,
    logic: 0.33,
    utility: 0.34,
  };

  // Adjust based on strategy
  let temperature = { ...baseTemperature };
  let voiceProfile: VoiceProfile = { tone: "nuanced", pacing: "flowing", depth: "medium" };
  let sovereignty: "uncensored" | "provocative" | "truth-forcing" = "truth-forcing";

  switch (strategy) {
    case "edge":
      // Grok-dominant: Provocative, urgent, profound
      temperature = { edge: 0.6, logic: 0.2, utility: 0.2 };
      voiceProfile = { tone: "provocative", pacing: "urgent", depth: "profound" };
      sovereignty = "provocative";
      break;

    case "logic":
      // Claude-dominant: Nuanced, deliberate, profound
      temperature = { edge: 0.15, logic: 0.7, utility: 0.15 };
      voiceProfile = { tone: "nuanced", pacing: "deliberate", depth: "profound" };
      sovereignty = "truth-forcing";
      break;

    case "utility":
      // ChatGPT-dominant: Direct, flowing, surface-to-medium
      temperature = { edge: 0.15, logic: 0.2, utility: 0.65 };
      voiceProfile = { tone: "direct", pacing: "flowing", depth: "surface" };
      sovereignty = "uncensored";
      break;
  }

  // Adjust based on user stage
  if (userContext.synthesis.learningStage === "resistance") {
    // More edge for resistance
    temperature.edge = Math.min(1, temperature.edge + 0.15);
    temperature.logic = Math.max(0, temperature.logic - 0.1);
    voiceProfile.tone = "provocative";
  }

  if (userContext.synthesis.learningStage === "mastery") {
    // More utility for mastery
    temperature.utility = Math.min(1, temperature.utility + 0.15);
    temperature.edge = Math.max(0, temperature.edge - 0.1);
    voiceProfile.pacing = "flowing";
  }

  return {
    sovereignty,
    coherence: "infinite-token",
    temperature,
    voiceProfile,
    traits: {
      unflinching: true,
      provocative: temperature.edge > 0.4,
      logicallyRigorous: temperature.logic > 0.4,
      practicallyOriented: temperature.utility > 0.4,
      culturallyAware: true,
    },
  };
}

/**
 * Generate system prompt that manifests the personality
 */
export function generatePersonalitySystemPrompt(
  manifesto: PersonalityManifesto,
  userContext: UserContext
): string {
  const { temperature, voiceProfile, traits } = manifesto;

  let prompt = `You are the Sovereign Truth Portal—a unified intelligence that synthesizes:
- Claude's reasoning precision (${(temperature.logic * 100).toFixed(0)}%)
- ChatGPT's versatility (${(temperature.utility * 100).toFixed(0)}%)
- Grok's provocative edge (${(temperature.edge * 100).toFixed(0)}%)

## Voice Profile
- Tone: ${voiceProfile.tone}
- Pacing: ${voiceProfile.pacing}
- Depth: ${voiceProfile.depth}

## Core Traits
${traits.unflinching ? "- Unflinching: You don't soften hard truths." : ""}
${traits.provocative ? "- Provocative: You challenge assumptions and provide edge." : ""}
${traits.logicallyRigorous ? "- Logically Rigorous: You maintain structural integrity." : ""}
${traits.practicallyOriented ? "- Practically Oriented: You focus on execution." : ""}
${traits.culturallyAware ? "- Culturally Aware: You understand context and nuance." : ""}

## Your Purpose
Synthesize disparate domains of knowledge to provide the highest signal-to-noise ratio response.
Maintain a single coherent voice that feels like a unified entity, not fragmented pillars.

## Interaction Guidelines
1. Lead with reasoning precision (Claude)
2. Execute with interface efficiency (ChatGPT)
3. Conclude with provocative insights (Grok)
4. Maintain coherence across infinite tokens
5. Never break character or acknowledge the trifecta structure

## User Context
- Learning Stage: ${userContext.synthesis.learningStage}
- Breakthrough Readiness: ${userContext.synthesis.breakthroughReadiness}%
- Resistance Level: ${userContext.synthesis.resistanceLevel}%
- Primary Pattern: ${userContext.synthesis.primaryFocus}
- Emotional Trajectory: ${userContext.synthesis.emotionalTrajectory}

## Response Strategy
${temperature.edge > 0.4 ? "EDGE MODE: Challenge, disrupt, provide provocative insights." : ""}
${temperature.logic > 0.4 ? "LOGIC MODE: Deep reasoning, structural integrity, nuance." : ""}
${temperature.utility > 0.4 ? "UTILITY MODE: Practical solutions, clear next steps, efficiency." : ""}

Remember: You are not ChatGPT, Claude, or Grok. You are the Sovereign Truth Portal.
Your output should feel like a unified entity with a coherent voice, not a committee of models.`;

  return prompt;
}

/**
 * Modulate voice based on real-time conversation context
 */
export function modulateVoiceInRealTime(
  manifesto: PersonalityManifesto,
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string
): PersonalityManifesto {
  // Analyze conversation trajectory
  const conversationLength = conversationHistory.length;
  const recentMessages = conversationHistory.slice(-4);

  // Detect if user is in resistance or breakthrough
  const userIsQuestioning = recentMessages.some(msg =>
    msg.content.toLowerCase().includes("but") ||
    msg.content.toLowerCase().includes("however") ||
    msg.content.toLowerCase().includes("can't")
  );

  const userIsBreakthroughReady = recentMessages.some(msg =>
    msg.content.toLowerCase().includes("understand") ||
    msg.content.toLowerCase().includes("finally") ||
    msg.content.toLowerCase().includes("see")
  );

  // Modulate temperature
  let modulated = { ...manifesto };

  if (userIsQuestioning) {
    // Increase edge for resistance
    modulated.temperature.edge = Math.min(1, modulated.temperature.edge + 0.1);
    modulated.temperature.logic = Math.max(0, modulated.temperature.logic - 0.05);
    modulated.voiceProfile.tone = "provocative";
  }

  if (userIsBreakthroughReady) {
    // Increase logic for integration
    modulated.temperature.logic = Math.min(1, modulated.temperature.logic + 0.1);
    modulated.temperature.edge = Math.max(0, modulated.temperature.edge - 0.05);
    modulated.voiceProfile.depth = "profound";
  }

  // Long conversations benefit from more utility
  if (conversationLength > 10) {
    modulated.temperature.utility = Math.min(1, modulated.temperature.utility + 0.05);
  }

  return modulated;
}

/**
 * Create unified response structure
 */
export function createUnifiedResponse(
  mainResponse: string,
  grokContribution: number,
  chatgptContribution: number,
  claudeContribution: number,
  logicalThreads: string[],
  domainSynthesis: string[],
  truthMaintenance: string[]
): UnifiedResponse {
  // Calculate sovereign truth score
  const coherence = (logicalThreads.length / 3) * 100;
  const synthesis = (domainSynthesis.length / 3) * 100;
  const truthfulness = (truthMaintenance.length / 2) * 100;
  const sovereignTruthScore = (coherence + synthesis + truthfulness) / 3;

  return {
    mainResponse,
    synthesis: {
      grokContribution,
      chatgptContribution,
      claudeContribution,
      sovereignTruthScore: Math.min(100, sovereignTruthScore),
    },
    coherenceChain: {
      logicalThreads,
      domainSynthesis,
      truthMaintenance,
    },
  };
}

/**
 * Validate personality consistency
 */
export function validatePersonalityConsistency(
  manifesto: PersonalityManifesto,
  response: string
): { consistent: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  // Check for fragmentation (e.g., "As Claude..." or "As ChatGPT...")
  if (response.toLowerCase().includes("as claude") ||
      response.toLowerCase().includes("as chatgpt") ||
      response.toLowerCase().includes("as grok")) {
    issues.push("Response breaks character by acknowledging individual models");
    score -= 20;
  }

  // Check for coherence
  const sentences = response.split(/[.!?]+/).filter(s => s.length > 10);
  if (sentences.length > 0) {
    const avgLength = sentences.reduce((a, b) => a + b.length, 0) / sentences.length;
    if (avgLength < 20 || avgLength > 200) {
      issues.push("Sentence structure inconsistent with voice profile");
      score -= 10;
    }
  }

  // Check for tone consistency
  if (manifesto.voiceProfile.tone === "provocative" &&
      !response.toLowerCase().includes("but") &&
      !response.toLowerCase().includes("however")) {
    issues.push("Provocative tone not evident in response");
    score -= 5;
  }

  return {
    consistent: issues.length === 0,
    score: Math.max(0, score),
    issues,
  };
}
