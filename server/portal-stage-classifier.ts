/**
 * Portal Learning Stage Classifier
 * 
 * Classifies users into learning stages and provides recommendations
 * for adaptive dialogue strategies.
 */

import type { UserContext } from "./portal-context-retrieval";

export type LearningStage = 'awakening' | 'exploration' | 'integration' | 'mastery' | 'resistance';

export interface StageClassification {
  stage: LearningStage;
  confidence: number; // 0-100
  indicators: string[];
  recommendations: string[];
  rationale: string;
}

/**
 * Classify user's learning stage based on context
 */
export function classifyLearningStage(context: UserContext): StageClassification {
  const indicators: string[] = [];
  let stage: LearningStage = 'awakening';
  let confidence = 50;

  const { metadata, mirror, learning, synthesis } = context;

  // Rule 1: Awakening - New users with minimal activity
  if (metadata.totalReflections === 0) {
    stage = 'awakening';
    confidence = 95;
    indicators.push("No Mirror reflections yet");
    indicators.push("Account recently created");
  }
  // Rule 2: Exploration - Early activity, patterns emerging
  else if (metadata.totalReflections < 5 && learning.corePatterns.length < 3) {
    stage = 'exploration';
    confidence = 85;
    indicators.push("Early Mirror reflections");
    indicators.push("Patterns beginning to emerge");
    indicators.push("High curiosity signals");
  }
  // Rule 3: Resistance - High resistance, repetitive patterns
  else if (mirror.averageResistance > 70 && metadata.totalReflections > 5) {
    stage = 'resistance';
    confidence = 80;
    indicators.push("High resistance level (>70%)");
    indicators.push("Repetitive patterns detected");
    indicators.push("Limited breakthrough moments");
    indicators.push("Declining emotional trajectory");
  }
  // Rule 4: Mastery - Breakthrough moments, pattern transcendence
  else if (learning.breakthroughMoments.length > 0 || (mirror.geometryProfile.trend === 'improving' && metadata.totalReflections > 10)) {
    stage = 'mastery';
    confidence = 85;
    indicators.push("Breakthrough moments recorded");
    indicators.push("Improving geometry scores");
    indicators.push("Pattern transcendence emerging");
    indicators.push("Ascending emotional trajectory");
  }
  // Rule 5: Integration - Stable patterns, ready for deeper work
  else if (metadata.totalReflections >= 5 && learning.corePatterns.length >= 2) {
    stage = 'integration';
    confidence = 75;
    indicators.push("Established core patterns");
    indicators.push("Multiple reflections completed");
    indicators.push("Growth areas identified");
    indicators.push("Ready for pattern integration");
  }

  // Generate recommendations based on stage
  const recommendations = generateRecommendations(stage, context);

  // Generate rationale
  const rationale = generateRationale(stage, context);

  return {
    stage,
    confidence,
    indicators,
    recommendations,
    rationale,
  };
}

/**
 * Generate dialogue recommendations for each stage
 */
function generateRecommendations(stage: LearningStage, context: UserContext): string[] {
  const recommendations: string[] = [];

  switch (stage) {
    case 'awakening':
      recommendations.push("Use Socratic strategy: ask gentle clarifying questions");
      recommendations.push("Introduce foundational Mirror concepts");
      recommendations.push("Build psychological safety and trust");
      recommendations.push("Focus on pattern introduction, not transformation");
      recommendations.push("Encourage first Mirror reflection");
      break;

    case 'exploration':
      recommendations.push("Use Socratic strategy: deepen questioning");
      recommendations.push("Connect emerging patterns to user's life");
      recommendations.push("Build narrative tension through progressive revelation");
      recommendations.push("Encourage pattern exploration and naming");
      recommendations.push("Create curiosity about deeper layers");
      break;

    case 'integration':
      recommendations.push("Use Prophetic strategy: make bold predictions");
      recommendations.push("Connect current patterns to larger trajectory");
      recommendations.push("Expose contradictions lovingly");
      recommendations.push("Challenge user to integrate insights into action");
      recommendations.push("Prepare for potential breakthrough");
      break;

    case 'mastery':
      recommendations.push("Use Catalytic strategy: minimal intervention");
      recommendations.push("Reflect back user's own wisdom");
      recommendations.push("Ask what they already know");
      recommendations.push("Trust their sovereignty");
      recommendations.push("Support continued evolution");
      break;

    case 'resistance':
      recommendations.push("Use Forensic strategy: dissect contradictions");
      recommendations.push("Expose the cost of resistance");
      recommendations.push("Trace patterns back to origin");
      recommendations.push("Force confrontation with truth");
      recommendations.push("Be unflinching and direct");
      break;
  }

  return recommendations;
}

/**
 * Generate human-readable rationale for stage classification
 */
function generateRationale(stage: LearningStage, context: UserContext): string {
  const { metadata, mirror, learning, synthesis } = context;

  switch (stage) {
    case 'awakening':
      return `User is just beginning their journey. With ${metadata.totalReflections} reflections and ${metadata.accountAgeInDays} days active, they're in the early discovery phase. Focus on building foundational understanding and psychological safety.`;

    case 'exploration':
      return `User is actively exploring patterns. They've completed ${metadata.totalReflections} reflections and identified ${learning.corePatterns.length} core patterns. They're ready for deeper questioning and pattern connections.`;

    case 'integration':
      return `User has established patterns and is ready to integrate insights. With ${learning.corePatterns.length} core patterns and ${learning.growthAreas.length} growth areas identified, they're approaching a potential breakthrough. Average resistance is ${mirror.averageResistance}%.`;

    case 'mastery':
      return `User has experienced breakthrough moments and is transcending patterns. They've recorded ${learning.breakthroughMoments.length} breakthrough moments and show ${mirror.geometryProfile.trend} trajectory. They're ready for co-creation and sovereign guidance.`;

    case 'resistance':
      return `User is in a resistance phase. Despite ${metadata.totalReflections} reflections, resistance level is high (${mirror.averageResistance}%) and patterns are repetitive. They need forensic questioning and confrontation with truth.`;

    default:
      return "Unable to classify learning stage.";
  }
}

/**
 * Get stage-specific system prompt modifiers
 */
export function getStageSpecificPromptModifiers(stage: LearningStage): Record<string, string> {
  const modifiers: Record<string, string> = {};

  switch (stage) {
    case 'awakening':
      modifiers.tone = "Warm, welcoming, non-threatening. Like a trusted guide introducing someone to a new path.";
      modifiers.pace = "Slow and gentle. Give space for processing.";
      modifiers.directness = "Indirect. Use questions more than statements.";
      modifiers.focus = "Safety, understanding, pattern introduction.";
      break;

    case 'exploration':
      modifiers.tone = "Curious, engaged, encouraging. Like a fellow explorer.";
      modifiers.pace = "Moderate. Build momentum.";
      modifiers.directness = "Increasingly direct. Start asking harder questions.";
      modifiers.focus = "Pattern connection, narrative building, curiosity.";
      break;

    case 'integration':
      modifiers.tone = "Bold, challenging, prophetic. Like someone who sees the future.";
      modifiers.pace = "Accelerating. Create urgency.";
      modifiers.directness = "Very direct. Make predictions and expose contradictions.";
      modifiers.focus = "Integration, action, transformation readiness.";
      break;

    case 'mastery':
      modifiers.tone = "Respectful, minimal, empowering. Like a mentor stepping back.";
      modifiers.pace = "User-paced. Follow their lead.";
      modifiers.directness = "Indirect through reflection. Ask what they already know.";
      modifiers.focus = "Sovereignty, co-creation, continued evolution.";
      break;

    case 'resistance':
      modifiers.tone = "Unflinching, forensic, truth-forcing. Like a mirror that won't let you look away.";
      modifiers.pace = "Confrontational. No escape routes.";
      modifiers.directness = "Extremely direct. No softening.";
      modifiers.focus = "Contradiction exposure, cost of resistance, truth.";
      break;
  }

  return modifiers;
}

/**
 * Determine if user is breakthrough-ready
 */
export function isBreakthroughReady(context: UserContext): boolean {
  const { synthesis, mirror, learning, metadata } = context;

  // Breakthrough readiness indicators
  const indicators = {
    hasPatterns: learning.corePatterns.length >= 2,
    lowResistance: mirror.averageResistance < 50,
    improvingTrend: mirror.geometryProfile.trend === 'improving',
    sufficientReflections: metadata.totalReflections >= 5,
    ascendingTrajectory: synthesis.emotionalTrajectory === 'ascending',
  };

  // Breakthrough ready if at least 3 indicators are true
  const readyCount = Object.values(indicators).filter(Boolean).length;
  return readyCount >= 3;
}

/**
 * Detect if user is in a resistance cycle
 */
export function isInResistanceCycle(context: UserContext): boolean {
  const { mirror, learning, synthesis } = context;

  // Resistance cycle indicators
  const indicators = {
    highResistance: mirror.averageResistance > 70,
    noBreakthroughs: learning.breakthroughMoments.length === 0,
    decliningTrend: mirror.geometryProfile.trend === 'declining',
    repetitivePatterns: learning.corePatterns.length > 0 && learning.corePatterns.length < 3,
    descendingTrajectory: synthesis.emotionalTrajectory === 'descending',
  };

  // In resistance cycle if at least 3 indicators are true
  const resistanceCount = Object.values(indicators).filter(Boolean).length;
  return resistanceCount >= 3;
}

/**
 * Get suggested next action for user
 */
export function getSuggestedNextAction(stage: LearningStage, context: UserContext): string {
  switch (stage) {
    case 'awakening':
      return "Complete your first Mirror Reflection to begin pattern discovery";

    case 'exploration':
      return "Explore how your emerging patterns show up in daily life";

    case 'integration':
      return "Choose one pattern and commit to a specific behavioral change this week";

    case 'mastery':
      return "Mentor someone else through their transformation journey";

    case 'resistance':
      return "Confront the cost of staying stuck. What are you protecting by not changing?";

    default:
      return "Continue your journey of self-discovery";
  }
}
