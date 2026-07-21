/**
 * Trifecta Real-Time Feedback Loop & Tuning System
 * 
 * Evolves Trifecta weights based on user satisfaction, truthfulness, and novelty.
 * Creates an adaptive system that learns from every interaction.
 */

export interface UserFeedback {
  userId: number;
  conversationId: string;
  messageId: string;
  
  // Satisfaction metrics
  satisfaction: number;        // 1-5 (very dissatisfied to very satisfied)
  helpfulness: number;         // 1-5 (not helpful to extremely helpful)
  clarity: number;             // 1-5 (unclear to crystal clear)
  
  // Quality metrics
  truthfulness: number;        // 1-5 (misleading to completely truthful)
  novelty: number;             // 1-5 (generic to highly novel)
  applicability: number;       // 1-5 (not applicable to directly applicable)
  
  // Engagement metrics
  engagementLevel: number;     // 1-5 (disengaged to highly engaged)
  wouldRecommend: boolean;
  
  // Optional comments
  comments?: string;
  timestamp: string;
}

export interface TrifectaTuning {
  userId: number;
  
  // User-specific weights
  edgeVsLogicVsUtility: {
    edge: number;      // 0-1
    logic: number;     // 0-1
    utility: number;   // 0-1
  };
  
  // Auto-detect or manual control
  autoDetect: boolean;
  
  // Performance tracking
  performance: {
    userSatisfaction: number;    // 0-100
    truthfulness: number;        // 0-100
    novelty: number;             // 0-100
    applicability: number;       // 0-100
    overallScore: number;        // 0-100
  };
  
  // Evolutionary weights (learned from feedback)
  evolutionaryWeights: {
    grokWeight: number;
    chatgptWeight: number;
    claudeWeight: number;
  };
  
  // Feedback history
  feedbackHistory: UserFeedback[];
  
  // Tuning metadata
  conversationCount: number;
  lastUpdated: string;
  evolutionStage: "initialization" | "learning" | "optimization" | "mastery";
}

export interface TrifectaTuningUpdate {
  userId: number;
  previousWeights: { grok: number; chatgpt: number; claude: number };
  newWeights: { grok: number; chatgpt: number; claude: number };
  changeRationale: string;
  performanceImprovement: number;  // Percentage change
}

/**
 * Initialize tuning for new user
 */
export function initializeTuning(userId: number): TrifectaTuning {
  return {
    userId,
    edgeVsLogicVsUtility: {
      edge: 0.33,
      logic: 0.33,
      utility: 0.34,
    },
    autoDetect: true,
    performance: {
      userSatisfaction: 0,
      truthfulness: 0,
      novelty: 0,
      applicability: 0,
      overallScore: 0,
    },
    evolutionaryWeights: {
      grokWeight: 0.33,
      chatgptWeight: 0.33,
      claudeWeight: 0.34,
    },
    feedbackHistory: [],
    conversationCount: 0,
    lastUpdated: new Date().toISOString(),
    evolutionStage: "initialization",
  };
}

/**
 * Calculate normalized feedback score
 */
function calculateFeedbackScore(feedback: UserFeedback): number {
  // Weighted average of all metrics
  const weights = {
    satisfaction: 0.25,
    helpfulness: 0.15,
    clarity: 0.1,
    truthfulness: 0.2,
    novelty: 0.15,
    applicability: 0.1,
    engagement: 0.05,
  };

  const normalizedSatisfaction = (feedback.satisfaction / 5) * 100;
  const normalizedHelpfulness = (feedback.helpfulness / 5) * 100;
  const normalizedClarity = (feedback.clarity / 5) * 100;
  const normalizedTruthfulness = (feedback.truthfulness / 5) * 100;
  const normalizedNovelty = (feedback.novelty / 5) * 100;
  const normalizedApplicability = (feedback.applicability / 5) * 100;
  const normalizedEngagement = (feedback.engagementLevel / 5) * 100;

  const score =
    normalizedSatisfaction * weights.satisfaction +
    normalizedHelpfulness * weights.helpfulness +
    normalizedClarity * weights.clarity +
    normalizedTruthfulness * weights.truthfulness +
    normalizedNovelty * weights.novelty +
    normalizedApplicability * weights.applicability +
    normalizedEngagement * weights.engagement;

  return Math.min(100, score);
}

/**
 * Determine strategy preference from feedback
 */
function determineStrategyPreference(feedback: UserFeedback): {
  edgePreference: number;
  logicPreference: number;
  utilityPreference: number;
} {
  // High novelty + high engagement suggests user wants edge
  const edgePreference = (feedback.novelty / 5 + feedback.engagementLevel / 5) / 2;

  // High truthfulness + high clarity suggests user wants logic
  const logicPreference = (feedback.truthfulness / 5 + feedback.clarity / 5) / 2;

  // High applicability + high helpfulness suggests user wants utility
  const utilityPreference = (feedback.applicability / 5 + feedback.helpfulness / 5) / 2;

  return {
    edgePreference,
    logicPreference,
    utilityPreference,
  };
}

/**
 * Update tuning based on feedback
 */
export function updateTuningFromFeedback(
  tuning: TrifectaTuning,
  feedback: UserFeedback,
  learningRate: number = 0.1
): TrifectaTuningUpdate {
  const previousWeights = { ...tuning.evolutionaryWeights };
  const feedbackScore = calculateFeedbackScore(feedback);
  const strategyPreference = determineStrategyPreference(feedback);

  // Normalize preferences
  const totalPreference =
    strategyPreference.edgePreference +
    strategyPreference.logicPreference +
    strategyPreference.utilityPreference;

  const normalizedEdgePreference = strategyPreference.edgePreference / totalPreference;
  const normalizedLogicPreference = strategyPreference.logicPreference / totalPreference;
  const normalizedUtilityPreference = strategyPreference.utilityPreference / totalPreference;

  // Update weights using exponential moving average
  const newWeights = {
    grokWeight:
      tuning.evolutionaryWeights.grokWeight * (1 - learningRate) +
      normalizedEdgePreference * learningRate,
    chatgptWeight:
      tuning.evolutionaryWeights.chatgptWeight * (1 - learningRate) +
      normalizedUtilityPreference * learningRate,
    claudeWeight:
      tuning.evolutionaryWeights.claudeWeight * (1 - learningRate) +
      normalizedLogicPreference * learningRate,
  };

  // Update performance metrics
  const previousScore = tuning.performance.overallScore;
  tuning.performance.userSatisfaction =
    (tuning.performance.userSatisfaction * tuning.feedbackHistory.length + feedback.satisfaction * 20) /
    (tuning.feedbackHistory.length + 1);
  tuning.performance.truthfulness =
    (tuning.performance.truthfulness * tuning.feedbackHistory.length + feedback.truthfulness * 20) /
    (tuning.feedbackHistory.length + 1);
  tuning.performance.novelty =
    (tuning.performance.novelty * tuning.feedbackHistory.length + feedback.novelty * 20) /
    (tuning.feedbackHistory.length + 1);
  tuning.performance.applicability =
    (tuning.performance.applicability * tuning.feedbackHistory.length + feedback.applicability * 20) /
    (tuning.feedbackHistory.length + 1);
  tuning.performance.overallScore = feedbackScore;

  // Update evolutionary weights
  tuning.evolutionaryWeights = newWeights;

  // Add feedback to history
  tuning.feedbackHistory.push(feedback);

  // Update evolution stage
  if (tuning.feedbackHistory.length < 5) {
    tuning.evolutionStage = "initialization";
  } else if (tuning.feedbackHistory.length < 20) {
    tuning.evolutionStage = "learning";
  } else if (tuning.feedbackHistory.length < 50) {
    tuning.evolutionStage = "optimization";
  } else {
    tuning.evolutionStage = "mastery";
  }

  tuning.lastUpdated = new Date().toISOString();

  const performanceImprovement = ((tuning.performance.overallScore - previousScore) / previousScore) * 100;

  return {
    userId: tuning.userId,
    previousWeights: {
      grok: previousWeights.grokWeight,
      chatgpt: previousWeights.chatgptWeight,
      claude: previousWeights.claudeWeight,
    },
    newWeights: {
      grok: newWeights.grokWeight,
      chatgpt: newWeights.chatgptWeight,
      claude: newWeights.claudeWeight,
    },
    changeRationale: `Updated based on user feedback: satisfaction=${feedback.satisfaction}/5, truthfulness=${feedback.truthfulness}/5, novelty=${feedback.novelty}/5`,
    performanceImprovement,
  };
}

/**
 * Get recommended strategy based on current tuning
 */
export function getRecommendedStrategy(
  tuning: TrifectaTuning
): "edge" | "logic" | "utility" {
  const weights = tuning.evolutionaryWeights;

  if (weights.grokWeight > weights.chatgptWeight && weights.grokWeight > weights.claudeWeight) {
    return "edge";
  } else if (weights.claudeWeight > weights.chatgptWeight && weights.claudeWeight > weights.grokWeight) {
    return "logic";
  } else {
    return "utility";
  }
}

/**
 * Calculate tuning confidence
 */
export function calculateTuningConfidence(tuning: TrifectaTuning): number {
  // More feedback = higher confidence
  const feedbackConfidence = Math.min(100, (tuning.feedbackHistory.length / 20) * 100);

  // More consistent performance = higher confidence
  const scores = tuning.feedbackHistory.map(f => calculateFeedbackScore(f));
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
  const variance = scores.length > 1
    ? scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
    : 0;
  const consistencyConfidence = Math.max(0, 100 - variance / 10);

  // Weight-based confidence (more balanced = higher confidence)
  const weights = tuning.evolutionaryWeights;
  const maxWeight = Math.max(weights.grokWeight, weights.chatgptWeight, weights.claudeWeight);
  const weightConfidence = (1 - (maxWeight - 0.33) / 0.67) * 100;

  return (feedbackConfidence + consistencyConfidence + weightConfidence) / 3;
}

/**
 * Generate tuning report
 */
export function generateTuningReport(tuning: TrifectaTuning): string {
  const confidence = calculateTuningConfidence(tuning);
  const recommendedStrategy = getRecommendedStrategy(tuning);

  let report = `# Trifecta Tuning Report for User ${tuning.userId}\n\n`;

  report += `## Evolution Stage\n`;
  report += `**Stage:** ${tuning.evolutionStage}\n`;
  report += `**Confidence:** ${confidence.toFixed(1)}%\n`;
  report += `**Conversations:** ${tuning.feedbackHistory.length}\n\n`;

  report += `## Performance Metrics\n`;
  report += `| Metric | Score |\n`;
  report += `|--------|-------|\n`;
  report += `| User Satisfaction | ${tuning.performance.userSatisfaction.toFixed(1)}/100 |\n`;
  report += `| Truthfulness | ${tuning.performance.truthfulness.toFixed(1)}/100 |\n`;
  report += `| Novelty | ${tuning.performance.novelty.toFixed(1)}/100 |\n`;
  report += `| Applicability | ${tuning.performance.applicability.toFixed(1)}/100 |\n`;
  report += `| Overall Score | ${tuning.performance.overallScore.toFixed(1)}/100 |\n\n`;

  report += `## Evolutionary Weights\n`;
  report += `| Pillar | Weight |\n`;
  report += `|--------|--------|\n`;
  report += `| Grok (Edge) | ${(tuning.evolutionaryWeights.grokWeight * 100).toFixed(1)}% |\n`;
  report += `| ChatGPT (Utility) | ${(tuning.evolutionaryWeights.chatgptWeight * 100).toFixed(1)}% |\n`;
  report += `| Claude (Logic) | ${(tuning.evolutionaryWeights.claudeWeight * 100).toFixed(1)}% |\n\n`;

  report += `## Recommended Strategy\n`;
  report += `**Strategy:** ${recommendedStrategy.toUpperCase()}\n`;
  report += `This user responds best to ${recommendedStrategy === "edge" ? "provocative, disruptive insights" : recommendedStrategy === "logic" ? "deep reasoning and logical rigor" : "practical, actionable solutions"}.\n\n`;

  report += `## Feedback History\n`;
  report += `Total feedback entries: ${tuning.feedbackHistory.length}\n`;
  if (tuning.feedbackHistory.length > 0) {
    const recentFeedback = tuning.feedbackHistory.slice(-3);
    report += `\n**Recent Feedback:**\n`;
    recentFeedback.forEach((feedback, index) => {
      report += `${index + 1}. Satisfaction: ${feedback.satisfaction}/5, Truthfulness: ${feedback.truthfulness}/5, Novelty: ${feedback.novelty}/5\n`;
    });
  }

  report += `\n## Recommendations\n`;
  if (tuning.performance.overallScore < 60) {
    report += `- Portal is underperforming. Consider adjusting strategy or seeking user feedback on specific pain points.\n`;
  }
  if (tuning.performance.novelty < 50) {
    report += `- User feedback suggests need for more novel perspectives. Increase Grok weight.\n`;
  }
  if (tuning.performance.truthfulness < 50) {
    report += `- User feedback suggests truthfulness concerns. Increase Claude weight for deeper reasoning.\n`;
  }
  if (tuning.performance.applicability < 50) {
    report += `- User feedback suggests lack of practical value. Increase ChatGPT weight for utility.\n`;
  }

  return report;
}

/**
 * Export tuning for persistence
 */
export function exportTuning(tuning: TrifectaTuning): string {
  return JSON.stringify(tuning, null, 2);
}

/**
 * Import tuning from persistence
 */
export function importTuning(data: string): TrifectaTuning {
  return JSON.parse(data);
}

/**
 * Batch update multiple users' tunings
 */
export function batchUpdateTunings(
  tunings: Map<number, TrifectaTuning>,
  feedbackBatch: UserFeedback[]
): Map<number, TrifectaTuningUpdate> {
  const updates = new Map<number, TrifectaTuningUpdate>();

  feedbackBatch.forEach(feedback => {
    const tuning = tunings.get(feedback.userId);
    if (tuning) {
      const update = updateTuningFromFeedback(tuning, feedback);
      updates.set(feedback.userId, update);
    }
  });

  return updates;
}

/**
 * Aggregate tunings across user cohort
 */
export function aggregateTunings(tunings: TrifectaTuning[]): {
  averageGrokWeight: number;
  averageChatgptWeight: number;
  averageClaudeWeight: number;
  averageSatisfaction?: number;
  averageTruthfulness?: number;
  averageNovelty?: number;
} {
  const divisor = tunings.length || 1;
  const avgGrok = tunings.reduce((sum, t) => sum + t.evolutionaryWeights.grokWeight, 0) / divisor;
  const avgChatgpt = tunings.reduce((sum, t) => sum + t.evolutionaryWeights.chatgptWeight, 0) / divisor;
  const avgClaude = tunings.reduce((sum, t) => sum + t.evolutionaryWeights.claudeWeight, 0) / divisor;
  const avgSatisfaction = tunings.reduce((sum, t) => sum + t.performance.userSatisfaction, 0) / divisor;
  const avgTruthfulness = tunings.reduce((sum, t) => sum + t.performance.truthfulness, 0) / divisor;
  const avgNovelty = tunings.reduce((sum, t) => sum + t.performance.novelty, 0) / divisor;

  return {
    averageGrokWeight: avgGrok || 0.33,
    averageChatgptWeight: avgChatgpt || 0.33,
    averageClaudeWeight: avgClaude || 0.34,
    averageSatisfaction: avgSatisfaction || 0,
    averageTruthfulness: avgTruthfulness || 0,
    averageNovelty: avgNovelty || 0,
  };
}
