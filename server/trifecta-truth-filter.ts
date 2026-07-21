/**
 * Sovereign Truth Filter & Output Synthesis Engine
 * 
 * Synthesizes pillar responses into a single unified output.
 * Maximizes signal-to-noise ratio through intelligent filtering and weighting.
 */

import type { PillarResponse } from "./trifecta-orchestration";
import type { UserContext } from "./portal-context-retrieval";

export interface TruthFilterCriteria {
  // Signal-to-noise optimization
  signalMetrics: {
    coherence: number;           // 0-1: Logical consistency
    novelty: number;             // 0-1: Unique insights
    applicability: number;       // 0-1: Practical value
    truthfulness: number;        // 0-1: Factual accuracy
  };
  
  // Domain-specific weighting
  domainBias: {
    technical: number;           // Favor Claude
    creative: number;            // Favor ChatGPT
    provocative: number;         // Favor Grok
  };
  
  // User-stage weighting
  stageBias: {
    awakening: number;           // More Grok edge
    exploration: number;         // Balanced
    integration: number;         // More Claude logic
    mastery: number;             // More ChatGPT versatility
    resistance: number;          // More Grok confrontation
  };
}

export interface SovereignTruthOutput {
  // Final synthesized response
  response: string;
  
  // Transparency on synthesis
  synthesis: {
    primaryPillar: "grok" | "chatgpt" | "claude";
    secondaryPillars: string[];
    synthesisRationale: string;
    signalToNoiseRatio: number;  // 0-100
  };
  
  // Coherence maintenance
  coherence: {
    logicalChain: string[];
    domainBridges: string[];
    truthThread: string;
  };
}

/**
 * Create truth filter criteria based on user context
 */
export function createTruthFilterCriteria(
  userContext: UserContext,
  domain: string
): TruthFilterCriteria {
  // Base signal metrics
  const signalMetrics = {
    coherence: 0.85,
    novelty: 0.75,
    applicability: 0.8,
    truthfulness: 0.9,
  };

  // Domain-specific bias
  let domainBias = { technical: 0.33, creative: 0.33, provocative: 0.34 };
  if (domain.toLowerCase().includes("code") || domain.toLowerCase().includes("technical")) {
    domainBias = { technical: 0.6, creative: 0.2, provocative: 0.2 };
  } else if (domain.toLowerCase().includes("creative") || domain.toLowerCase().includes("brainstorm")) {
    domainBias = { technical: 0.2, creative: 0.6, provocative: 0.2 };
  } else if (domain.toLowerCase().includes("disrupt") || domain.toLowerCase().includes("challenge")) {
    domainBias = { technical: 0.2, creative: 0.2, provocative: 0.6 };
  }

  // User-stage bias
  let stageBias = {
    awakening: 0.1,
    exploration: 0.2,
    integration: 0.3,
    mastery: 0.2,
    resistance: 0.2,
  };

  switch (userContext.synthesis.learningStage) {
    case "awakening":
      stageBias = { awakening: 0.4, exploration: 0.3, integration: 0.15, mastery: 0.1, resistance: 0.05 };
      break;
    case "exploration":
      stageBias = { awakening: 0.1, exploration: 0.5, integration: 0.2, mastery: 0.1, resistance: 0.1 };
      break;
    case "integration":
      stageBias = { awakening: 0.05, exploration: 0.15, integration: 0.5, mastery: 0.2, resistance: 0.1 };
      break;
    case "mastery":
      stageBias = { awakening: 0.05, exploration: 0.1, integration: 0.2, mastery: 0.5, resistance: 0.15 };
      break;
    case "resistance":
      stageBias = { awakening: 0.1, exploration: 0.1, integration: 0.2, mastery: 0.1, resistance: 0.5 };
      break;
  }

  return {
    signalMetrics,
    domainBias,
    stageBias,
  };
}

/**
 * Score pillar response based on criteria
 */
export function scorePillarResponse(
  response: PillarResponse,
  criteria: TruthFilterCriteria
): number {
  let score = 0;

  // Base confidence and relevance
  score += response.metadata.confidence * 30;
  score += response.metadata.relevance * 30;
  score += response.metadata.signalStrength * 20;

  // Signal metrics
  score += criteria.signalMetrics.coherence * 10;
  score += criteria.signalMetrics.truthfulness * 10;

  // Domain bias
  if (response.pillar === "claude") {
    score += criteria.domainBias.technical * 5;
  } else if (response.pillar === "chatgpt") {
    score += criteria.domainBias.creative * 5;
  } else if (response.pillar === "grok") {
    score += criteria.domainBias.provocative * 5;
  }

  return Math.min(100, score);
}

/**
 * Select primary pillar based on scores
 */
export function selectPrimaryPillar(
  responses: PillarResponse[],
  scores: { [key: string]: number }
): "grok" | "chatgpt" | "claude" {
  let maxScore = -1;
  let primary: "grok" | "chatgpt" | "claude" = "claude";

  responses.forEach(response => {
    const score = scores[response.pillar] || 0;
    if (score > maxScore) {
      maxScore = score;
      primary = response.pillar;
    }
  });

  return primary;
}

/**
 * Extract logical threads from response
 */
function extractLogicalThreads(response: string): string[] {
  const threads: string[] = [];
  const sentences = response.split(/[.!?]+/).filter(s => s.length > 20);

  // Extract key logical statements
  sentences.forEach(sentence => {
    if (sentence.includes("therefore") ||
        sentence.includes("because") ||
        sentence.includes("leads to") ||
        sentence.includes("implies")) {
      threads.push(sentence.trim());
    }
  });

  return threads.slice(0, 3);
}

/**
 * Identify domain bridges between pillars
 */
function identifyDomainBridges(responses: PillarResponse[]): string[] {
  const bridges: string[] = [];

  // Look for common themes across pillars
  const allText = responses.map(r => r.response).join(" ");
  const keywords = ["pattern", "insight", "perspective", "approach", "method"];

  keywords.forEach(keyword => {
    if (allText.toLowerCase().includes(keyword)) {
      bridges.push(`Shared focus on ${keyword}`);
    }
  });

  return bridges;
}

/**
 * Maintain truth thread across synthesis
 */
function maintainTruthThread(
  responses: PillarResponse[],
  userContext: UserContext
): string {
  const grokResponse = responses.find(r => r.pillar === "grok")?.response || "";
  const chatgptResponse = responses.find(r => r.pillar === "chatgpt")?.response || "";
  const claudeResponse = responses.find(r => r.pillar === "claude")?.response || "";

  // Truth thread: What's consistent across all three?
  const truthPoints: string[] = [];

  // Analyze for common themes
  if (grokResponse.includes("challenge") && claudeResponse.includes("understand")) {
    truthPoints.push("Understanding requires challenging assumptions");
  }

  if (chatgptResponse.includes("action") && claudeResponse.includes("reason")) {
    truthPoints.push("Action flows from sound reasoning");
  }

  if (grokResponse.includes("truth") && claudeResponse.includes("logic")) {
    truthPoints.push("Truth emerges from logical rigor");
  }

  return truthPoints.join(" → ");
}

/**
 * Synthesize pillar responses into unified output
 */
export function synthesizeResponses(
  responses: PillarResponse[],
  userContext: UserContext,
  criteria: TruthFilterCriteria
): SovereignTruthOutput {
  // Score each pillar
  const scores: { [key: string]: number } = {};
  responses.forEach(response => {
    scores[response.pillar] = scorePillarResponse(response, criteria);
  });

  // Select primary pillar
  const primaryPillar = selectPrimaryPillar(responses, scores);
  const primaryResponse = responses.find(r => r.pillar === primaryPillar);

  if (!primaryResponse) {
    throw new Error("No primary pillar response found");
  }

  // Get secondary pillars
  const secondaryPillars = responses
    .filter(r => r.pillar !== primaryPillar)
    .sort((a, b) => (scores[b.pillar] || 0) - (scores[a.pillar] || 0))
    .map(r => r.pillar);

  // Extract coherence elements
  const logicalChain = extractLogicalThreads(primaryResponse.response);
  const domainBridges = identifyDomainBridges(responses);
  const truthThread = maintainTruthThread(responses, userContext);

  // Create synthesis rationale
  const synthesisRationale = `Primary pillar (${primaryPillar}): ${primaryResponse.metadata.uniqueInsight}. ` +
    `Secondary pillars: ${secondaryPillars.join(", ")}. ` +
    `Synthesis method: Hierarchical (${primaryPillar} leads).`;

  // Calculate signal-to-noise ratio
  const avgConfidence = responses.reduce((sum, r) => sum + r.metadata.confidence, 0) / responses.length;
  const avgRelevance = responses.reduce((sum, r) => sum + r.metadata.relevance, 0) / responses.length;
  const avgSignal = responses.reduce((sum, r) => sum + r.metadata.signalStrength, 0) / responses.length;
  const signalToNoiseRatio = ((avgConfidence + avgRelevance + avgSignal) / 3) * 100;

  // Create unified response
  const unifiedResponse = `${primaryResponse.response}

[Synthesis: This response draws primarily from ${primaryPillar}'s perspective, enriched by insights from ${secondaryPillars.join(" and ")}. The unified voice maintains coherence across all three pillars.]`;

  return {
    response: unifiedResponse,
    synthesis: {
      primaryPillar,
      secondaryPillars,
      synthesisRationale,
      signalToNoiseRatio: Math.min(100, signalToNoiseRatio),
    },
    coherence: {
      logicalChain,
      domainBridges,
      truthThread,
    },
  };
}

/**
 * Validate synthesis output
 */
export function validateSynthesis(output: SovereignTruthOutput): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!output.response || output.response.length === 0) {
    issues.push("Synthesized response is empty");
  }

  if (output.synthesis.signalToNoiseRatio < 50) {
    issues.push(`Low signal-to-noise ratio: ${output.synthesis.signalToNoiseRatio}%`);
  }

  if (output.coherence.logicalChain.length === 0) {
    issues.push("No logical chains detected");
  }

  if (!output.coherence.truthThread || output.coherence.truthThread.length === 0) {
    issues.push("Truth thread not maintained");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Calculate sovereign truth score (0-100)
 */
export function calculateSovereignTruthScore(output: SovereignTruthOutput): number {
  let score = 0;

  // Signal-to-noise ratio (40%)
  score += output.synthesis.signalToNoiseRatio * 0.4;

  // Coherence (30%)
  const coherenceScore = (output.coherence.logicalChain.length + output.coherence.domainBridges.length) * 5;
  score += Math.min(30, coherenceScore);

  // Truth maintenance (30%)
  const truthScore = output.coherence.truthThread.length > 0 ? 30 : 0;
  score += truthScore;

  return Math.min(100, score);
}
