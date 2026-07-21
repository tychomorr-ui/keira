/**
 * Trifecta Auto-Detection Engine
 * 
 * Automatically detects whether user needs Edge (disruption), Logic (stability),
 * or Utility (execution) based on user context and conversation state.
 */

import type { UserContext } from "./portal-context-retrieval";

export interface ResponseStrategyDetection {
  // What does the user need?
  requiredStrategy: "edge" | "logic" | "utility";
  confidence: number;  // 0-1
  
  // Why?
  reasoning: {
    userStage: string;
    conversationContext: string;
    resistanceLevel: number;
    emotionalTrajectory: string;
    domainOfInquiry: string;
    signals: string[];
  };
  
  // How to execute
  execution: {
    grokWeight: number;
    chatgptWeight: number;
    claudeWeight: number;
    temperature: number;
    synthesisMethod: string;
  };
}

/**
 * Analyze user message for strategy signals
 */
function analyzeMessageSignals(message: string): {
  edgeSignals: string[];
  logicSignals: string[];
  utilitySignals: string[];
} {
  const lower = message.toLowerCase();

  const edgeSignals: string[] = [];
  const logicSignals: string[] = [];
  const utilitySignals: string[] = [];

  // Edge signals (disruption, challenge, provocation)
  const edgeKeywords = [
    "but", "however", "why", "disagree", "wrong", "challenge",
    "assumption", "question", "prove", "stuck", "blocked",
    "frustrated", "angry", "afraid", "resistance",
  ];

  edgeKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      edgeSignals.push(keyword);
    }
  });

  // Logic signals (understanding, reasoning, structure)
  const logicKeywords = [
    "understand", "explain", "how", "why", "reason",
    "logic", "structure", "framework", "model", "theory",
    "analysis", "breakdown", "complex", "deep",
  ];

  logicKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      logicSignals.push(keyword);
    }
  });

  // Utility signals (action, execution, practical)
  const utilityKeywords = [
    "do", "how to", "steps", "action", "execute",
    "implement", "build", "create", "start", "now",
    "practical", "quick", "fast", "efficient", "solution",
  ];

  utilityKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      utilitySignals.push(keyword);
    }
  });

  return { edgeSignals, logicSignals, utilitySignals };
}

/**
 * Score strategy fit based on user stage
 */
function scoreStrategyByStage(
  stage: string
): { edge: number; logic: number; utility: number } {
  const scores = { edge: 0.33, logic: 0.33, utility: 0.34 };

  switch (stage) {
    case "awakening":
      // New users benefit from edge (disruption) to wake up
      scores.edge = 0.5;
      scores.logic = 0.3;
      scores.utility = 0.2;
      break;

    case "exploration":
      // Explorers need balanced approach
      scores.edge = 0.3;
      scores.logic = 0.4;
      scores.utility = 0.3;
      break;

    case "integration":
      // Integrators need logic to synthesize
      scores.edge = 0.2;
      scores.logic = 0.5;
      scores.utility = 0.3;
      break;

    case "mastery":
      // Masters need utility to execute
      scores.edge = 0.15;
      scores.logic = 0.3;
      scores.utility = 0.55;
      break;

    case "resistance":
      // Resistance needs edge to break through
      scores.edge = 0.6;
      scores.logic = 0.25;
      scores.utility = 0.15;
      break;
  }

  return scores;
}

/**
 * Score strategy fit based on resistance level
 */
function scoreStrategyByResistance(
  resistanceLevel: number
): { edge: number; logic: number; utility: number } {
  const scores = { edge: 0.33, logic: 0.33, utility: 0.34 };

  if (resistanceLevel > 70) {
    // High resistance needs edge to confront
    scores.edge = 0.6;
    scores.logic = 0.2;
    scores.utility = 0.2;
  } else if (resistanceLevel > 50) {
    // Medium resistance needs balanced edge and logic
    scores.edge = 0.4;
    scores.logic = 0.35;
    scores.utility = 0.25;
  } else if (resistanceLevel < 30) {
    // Low resistance can focus on utility
    scores.edge = 0.2;
    scores.logic = 0.3;
    scores.utility = 0.5;
  }

  return scores;
}

/**
 * Score strategy fit based on emotional trajectory
 */
function scoreStrategyByTrajectory(
  trajectory: string
): { edge: number; logic: number; utility: number } {
  const scores = { edge: 0.33, logic: 0.33, utility: 0.34 };

  switch (trajectory) {
    case "ascending":
      // Ascending needs utility to capitalize
      scores.edge = 0.2;
      scores.logic = 0.3;
      scores.utility = 0.5;
      break;

    case "descending":
      // Descending needs edge to interrupt
      scores.edge = 0.5;
      scores.logic = 0.3;
      scores.utility = 0.2;
      break;

    case "stable":
      // Stable can be balanced
      scores.edge = 0.33;
      scores.logic = 0.33;
      scores.utility = 0.34;
      break;
  }

  return scores;
}

/**
 * Detect optimal response strategy
 */
export function detectOptimalStrategy(
  userContext: UserContext,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): ResponseStrategyDetection {
  // Analyze message signals
  const signals = analyzeMessageSignals(message);
  const totalSignals = signals.edgeSignals.length + signals.logicSignals.length + signals.utilitySignals.length;

  // Score by different dimensions
  const stageScores = scoreStrategyByStage(userContext.synthesis.learningStage);
  const resistanceScores = scoreStrategyByResistance(userContext.synthesis.resistanceLevel);
  const trajectoryScores = scoreStrategyByTrajectory(userContext.synthesis.emotionalTrajectory);

  // Weight message signals
  let messageWeight = { edge: 0.33, logic: 0.33, utility: 0.34 };
  if (totalSignals > 0) {
    messageWeight.edge = signals.edgeSignals.length / totalSignals;
    messageWeight.logic = signals.logicSignals.length / totalSignals;
    messageWeight.utility = signals.utilitySignals.length / totalSignals;
  }

  // Combine all scores (40% stage, 30% resistance, 20% trajectory, 10% message)
  const finalScores = {
    edge: stageScores.edge * 0.4 + resistanceScores.edge * 0.3 + trajectoryScores.edge * 0.2 + messageWeight.edge * 0.1,
    logic: stageScores.logic * 0.4 + resistanceScores.logic * 0.3 + trajectoryScores.logic * 0.2 + messageWeight.logic * 0.1,
    utility: stageScores.utility * 0.4 + resistanceScores.utility * 0.3 + trajectoryScores.utility * 0.2 + messageWeight.utility * 0.1,
  };

  // Determine primary strategy
  let requiredStrategy: "edge" | "logic" | "utility" = "logic";
  let maxScore = finalScores.logic;

  if (finalScores.edge > maxScore) {
    requiredStrategy = "edge";
    maxScore = finalScores.edge;
  }
  if (finalScores.utility > maxScore) {
    requiredStrategy = "utility";
    maxScore = finalScores.utility;
  }

  // Calculate confidence
  const confidence = maxScore / (finalScores.edge + finalScores.logic + finalScores.utility);

  // Determine domain of inquiry
  let domainOfInquiry = "general";
  if (message.toLowerCase().includes("code") || message.toLowerCase().includes("technical")) {
    domainOfInquiry = "technical";
  } else if (message.toLowerCase().includes("create") || message.toLowerCase().includes("idea")) {
    domainOfInquiry = "creative";
  } else if (message.toLowerCase().includes("pattern") || message.toLowerCase().includes("understand")) {
    domainOfInquiry = "analytical";
  }

  // Build reasoning
  const allSignals = [
    ...signals.edgeSignals.map(s => `edge: ${s}`),
    ...signals.logicSignals.map(s => `logic: ${s}`),
    ...signals.utilitySignals.map(s => `utility: ${s}`),
  ];

  // Create execution weights
  const executionWeights = {
    grokWeight: finalScores.edge,
    chatgptWeight: finalScores.utility,
    claudeWeight: finalScores.logic,
  };

  // Normalize
  const total = executionWeights.grokWeight + executionWeights.chatgptWeight + executionWeights.claudeWeight;
  executionWeights.grokWeight /= total;
  executionWeights.chatgptWeight /= total;
  executionWeights.claudeWeight /= total;

  return {
    requiredStrategy,
    confidence,
    reasoning: {
      userStage: userContext.synthesis.learningStage,
      conversationContext: `${conversationHistory.length} messages in conversation`,
      resistanceLevel: userContext.synthesis.resistanceLevel,
      emotionalTrajectory: userContext.synthesis.emotionalTrajectory,
      domainOfInquiry,
      signals: allSignals,
    },
    execution: {
      grokWeight: executionWeights.grokWeight,
      chatgptWeight: executionWeights.chatgptWeight,
      claudeWeight: executionWeights.claudeWeight,
      temperature: confidence,
      synthesisMethod: confidence > 0.8 ? "hierarchical" : "fusion",
    },
  };
}

/**
 * Validate strategy detection
 */
export function validateStrategyDetection(detection: ResponseStrategyDetection): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (detection.confidence < 0.5) {
    issues.push(`Low confidence in strategy detection: ${(detection.confidence * 100).toFixed(0)}%`);
  }

  if (detection.execution.grokWeight < 0 || detection.execution.grokWeight > 1) {
    issues.push("Invalid Grok weight");
  }

  if (detection.execution.chatgptWeight < 0 || detection.execution.chatgptWeight > 1) {
    issues.push("Invalid ChatGPT weight");
  }

  if (detection.execution.claudeWeight < 0 || detection.execution.claudeWeight > 1) {
    issues.push("Invalid Claude weight");
  }

  const weightSum = detection.execution.grokWeight + detection.execution.chatgptWeight + detection.execution.claudeWeight;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    issues.push(`Weights don't sum to 1.0: ${weightSum}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get strategy explanation
 */
export function explainStrategy(detection: ResponseStrategyDetection): string {
  const { requiredStrategy, reasoning, execution } = detection;

  let explanation = `**Detected Strategy: ${requiredStrategy.toUpperCase()}**\n\n`;
  explanation += `**Why:** `;

  switch (requiredStrategy) {
    case "edge":
      explanation += `User is in ${reasoning.userStage} stage with ${reasoning.resistanceLevel}% resistance. `;
      explanation += `They need disruption and challenge to break through patterns.`;
      break;
    case "logic":
      explanation += `User is in ${reasoning.userStage} stage and needs deep reasoning. `;
      explanation += `Emotional trajectory is ${reasoning.emotionalTrajectory}.`;
      break;
    case "utility":
      explanation += `User is in ${reasoning.userStage} stage and ready for execution. `;
      explanation += `Focus on practical next steps and clear implementation.`;
      break;
  }

  explanation += `\n\n**Pillar Weights:**\n`;
  explanation += `- Grok (Edge): ${(execution.grokWeight * 100).toFixed(0)}%\n`;
  explanation += `- ChatGPT (Utility): ${(execution.chatgptWeight * 100).toFixed(0)}%\n`;
  explanation += `- Claude (Logic): ${(execution.claudeWeight * 100).toFixed(0)}%\n`;

  explanation += `\n**Confidence:** ${(detection.confidence * 100).toFixed(0)}%`;

  return explanation;
}
