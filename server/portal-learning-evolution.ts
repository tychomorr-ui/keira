/**
 * Portal Learning Evolution
 * 
 * Evolves Portal's understanding of the user over time through recursive analysis
 * of patterns, breakthroughs, and transformation trajectory.
 */

import { getDb } from "./db";
import { portalLearningMemory, portalChatMessages, mirrorReflections } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { AdaptiveResponse } from "./portal-adaptive-response";
import type { UserContext } from "./portal-context-retrieval";

export interface EvolutionUpdate {
  patterns: string[];
  breakthroughMoments: string[];
  resistancePoints: string[];
  growthAreas: string[];
  evolutionTimeline: string[];
}

/**
 * Analyze Portal response for learning insights
 */
export async function analyzeResponseForLearning(
  userId: number,
  userMessage: string,
  portalResponse: string,
  context: UserContext
): Promise<EvolutionUpdate> {
  const updates: EvolutionUpdate = {
    patterns: [...context.learning.corePatterns],
    breakthroughMoments: [...context.learning.breakthroughMoments],
    resistancePoints: [...context.learning.resistancePoints],
    growthAreas: [...context.learning.growthAreas],
    evolutionTimeline: [...context.learning.evolutionTimeline],
  };

  // 1. Extract new patterns from user message and Portal response
  const extractedPatterns = extractPatternsFromExchange(userMessage, portalResponse);
  extractedPatterns.forEach(pattern => {
    if (!updates.patterns.includes(pattern) && pattern.length < 100) {
      updates.patterns.push(pattern);
    }
  });
  updates.patterns = updates.patterns.slice(-15); // Keep last 15

  // 2. Detect breakthrough moments
  if (isBreakthroughMoment(userMessage, portalResponse, context)) {
    const breakthroughSummary = summarizeBreakthrough(userMessage, portalResponse);
    updates.breakthroughMoments.push(breakthroughSummary);
    updates.breakthroughMoments = updates.breakthroughMoments.slice(-10);

    // Add to evolution timeline
    const timelineEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'Breakthrough moment',
      shift: breakthroughSummary,
    });
    updates.evolutionTimeline.push(timelineEntry);
  }

  // 3. Detect resistance patterns
  const resistanceIndicators = detectResistanceIndicators(userMessage, context);
  resistanceIndicators.forEach(indicator => {
    if (!updates.resistancePoints.includes(indicator) && indicator.length < 100) {
      updates.resistancePoints.push(indicator);
    }
  });
  updates.resistancePoints = updates.resistancePoints.slice(-10);

  // 4. Identify growth areas
  const growthIndicators = detectGrowthIndicators(userMessage, portalResponse, context);
  growthIndicators.forEach(indicator => {
    if (!updates.growthAreas.includes(indicator) && indicator.length < 100) {
      updates.growthAreas.push(indicator);
    }
  });
  updates.growthAreas = updates.growthAreas.slice(-10);

  // 5. Track evolution trajectory
  const evolutionEvent = detectEvolutionEvent(userMessage, portalResponse, context);
  if (evolutionEvent) {
    const timelineEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      event: evolutionEvent.type,
      shift: evolutionEvent.description,
    });
    updates.evolutionTimeline.push(timelineEntry);
    updates.evolutionTimeline = updates.evolutionTimeline.slice(-20);
  }

  return updates;
}

/**
 * Extract patterns from user message and Portal response
 */
function extractPatternsFromExchange(userMessage: string, portalResponse: string): string[] {
  const patterns: string[] = [];

  // Look for pattern keywords in both messages
  const patternKeywords = [
    'always', 'never', 'every time', 'whenever', 'constantly',
    'tendency', 'habit', 'pattern', 'cycle', 'loop',
    'afraid', 'fear', 'avoid', 'resist', 'block',
    'want', 'desire', 'need', 'crave', 'seek',
  ];

  const combinedText = `${userMessage} ${portalResponse}`.toLowerCase();

  // Extract sentences containing pattern keywords
  const sentences = combinedText.split(/[.!?]+/);
  sentences.forEach(sentence => {
    if (sentence.length > 20 && sentence.length < 150) {
      const hasKeyword = patternKeywords.some(kw => sentence.includes(kw));
      if (hasKeyword) {
        const cleaned = sentence.trim().replace(/^[^a-z]*/, '');
        if (cleaned.length > 10) {
          patterns.push(cleaned);
        }
      }
    }
  });

  return Array.from(new Set(patterns)).slice(0, 5); // Unique, max 5
}

/**
 * Detect if this is a breakthrough moment
 */
function isBreakthroughMoment(userMessage: string, portalResponse: string, context: UserContext): boolean {
  const breakthroughKeywords = [
    'breakthrough', 'transformation', 'shift', 'transcend', 'awakening',
    'realization', 'surrender', 'acceptance', 'finally', 'understand',
    'see it now', 'get it', 'aha', 'eureka', 'wow',
  ];

  const combinedText = `${userMessage} ${portalResponse}`.toLowerCase();
  const hasBreakthroughLanguage = breakthroughKeywords.some(kw => combinedText.includes(kw));

  // Also check if resistance is dropping significantly
  const hasResistanceShift = context.synthesis.resistanceLevel < 40;

  return hasBreakthroughLanguage || (hasResistanceShift && context.synthesis.breakthroughReadiness > 70);
}

/**
 * Summarize a breakthrough moment
 */
function summarizeBreakthrough(userMessage: string, portalResponse: string): string {
  // Extract key insight from Portal response
  const sentences = portalResponse.split(/[.!?]+/).filter(s => s.length > 20);
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 150);
  }
  return "Breakthrough moment detected";
}

/**
 * Detect resistance indicators
 */
function detectResistanceIndicators(userMessage: string, context: UserContext): string[] {
  const indicators: string[] = [];

  const resistanceKeywords = [
    'but', 'however', 'yet', 'though', 'still',
    'can\'t', 'won\'t', 'shouldn\'t', 'couldn\'t',
    'afraid', 'scared', 'worried', 'anxious',
    'stuck', 'blocked', 'trapped', 'helpless',
  ];

  const text = userMessage.toLowerCase();
  resistanceKeywords.forEach(kw => {
    if (text.includes(kw)) {
      // Extract context around keyword
      const index = text.indexOf(kw);
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + 50);
      const context = userMessage.substring(start, end).trim();
      if (context.length > 10) {
        indicators.push(context);
      }
    }
  });

  return Array.from(new Set(indicators)).slice(0, 3);
}

/**
 * Detect growth indicators
 */
function detectGrowthIndicators(userMessage: string, portalResponse: string, context: UserContext): string[] {
  const indicators: string[] = [];

  const growthKeywords = [
    'trying', 'attempting', 'working on', 'practicing',
    'growing', 'developing', 'emerging', 'building',
    'strength', 'capacity', 'ability', 'skill',
    'better', 'improving', 'progress', 'advancing',
  ];

  const combinedText = `${userMessage} ${portalResponse}`.toLowerCase();
  growthKeywords.forEach(kw => {
    if (combinedText.includes(kw)) {
      const index = combinedText.indexOf(kw);
      const start = Math.max(0, index - 30);
      const end = Math.min(combinedText.length, index + 50);
      const context = `${userMessage} ${portalResponse}`.substring(start, end).trim();
      if (context.length > 10) {
        indicators.push(context);
      }
    }
  });

  return Array.from(new Set(indicators)).slice(0, 3);
}

/**
 * Detect evolution events (stage transitions, pattern shifts, etc.)
 */
function detectEvolutionEvent(
  userMessage: string,
  portalResponse: string,
  context: UserContext
): { type: string; description: string } | null {
  const combinedText = `${userMessage} ${portalResponse}`.toLowerCase();

  // Check for stage transition indicators
  if (context.synthesis.breakthroughReadiness > 80 && combinedText.includes('breakthrough')) {
    return {
      type: 'Stage Transition',
      description: `Ready for transition from ${context.synthesis.learningStage} to next stage`,
    };
  }

  // Check for pattern transcendence
  if (combinedText.includes('transcend') || combinedText.includes('beyond')) {
    return {
      type: 'Pattern Transcendence',
      description: 'User is transcending a core pattern',
    };
  }

  // Check for resistance breakthrough
  if (context.synthesis.resistanceLevel < 30 && combinedText.includes('accept')) {
    return {
      type: 'Resistance Breakthrough',
      description: 'User is breaking through resistance',
    };
  }

  // Check for integration moment
  if (combinedText.includes('understand') || combinedText.includes('see')) {
    return {
      type: 'Integration Moment',
      description: 'User is integrating insights',
    };
  }

  return null;
}

/**
 * Generate learning summary for user
 */
export async function generateLearningSummary(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "Unable to generate summary";

  try {
    // Get recent chat messages
    const recentMessages = await db
      .select()
      .from(portalChatMessages)
      .where(eq(portalChatMessages.userId, userId))
      .orderBy(desc(portalChatMessages.createdAt))
      .limit(20);

    // Get recent Mirror reflections
    const recentReflections = await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId))
      .orderBy(desc(mirrorReflections.createdAt))
      .limit(5);

    // Get learning memory
    const memory = await db
      .select()
      .from(portalLearningMemory)
      .where(eq(portalLearningMemory.userId, userId))
      .limit(1);

    if (!memory.length) return "Learning journey just beginning";

    const m = memory[0];
    const patterns = JSON.parse(m.corePatterns || '[]');
    const breakthroughs = JSON.parse(m.breakthroughMoments || '[]');
    const growthAreas = JSON.parse(m.growthAreas || '[]');

    // Build summary
    const lines: string[] = [];

    lines.push("## Your Learning Journey\n");

    if (patterns.length > 0) {
      lines.push(`**Core Patterns:** ${patterns.slice(0, 3).join(", ")}`);
    }

    if (growthAreas.length > 0) {
      lines.push(`**Growth Areas:** ${growthAreas.slice(0, 3).join(", ")}`);
    }

    if (breakthroughs.length > 0) {
      lines.push(`**Breakthrough Moments:** ${breakthroughs.length} transformations recorded`);
    }

    lines.push(`\n**Recent Activity:** ${recentMessages.length} chat messages, ${recentReflections.length} Mirror reflections`);

    return lines.join("\n");
  } catch (error) {
    console.error("[Portal Learning] Failed to generate summary:", error);
    return "Unable to generate summary";
  }
}

/**
 * Detect if user is ready for next learning stage
 */
export function detectStageReadiness(context: UserContext): { ready: boolean; nextStage?: string; indicators: string[] } {
  const indicators: string[] = [];

  switch (context.synthesis.learningStage) {
    case 'awakening':
      if (context.metadata.totalReflections >= 3) {
        indicators.push("Multiple reflections completed");
      }
      if (context.learning.corePatterns.length >= 2) {
        indicators.push("Core patterns identified");
      }
      if (indicators.length >= 2) {
        return { ready: true, nextStage: 'exploration', indicators };
      }
      break;

    case 'exploration':
      if (context.learning.corePatterns.length >= 3) {
        indicators.push("Multiple patterns established");
      }
      if (context.mirror.geometryProfile.trend === 'improving') {
        indicators.push("Improving geometry scores");
      }
      if (context.synthesis.breakthroughReadiness > 60) {
        indicators.push("Breakthrough readiness emerging");
      }
      if (indicators.length >= 2) {
        return { ready: true, nextStage: 'integration', indicators };
      }
      break;

    case 'integration':
      if (context.learning.breakthroughMoments.length > 0) {
        indicators.push("Breakthrough moments recorded");
      }
      if (context.synthesis.breakthroughReadiness > 80) {
        indicators.push("High breakthrough readiness");
      }
      if (context.mirror.geometryProfile.trend === 'improving') {
        indicators.push("Strong improvement trajectory");
      }
      if (indicators.length >= 2) {
        return { ready: true, nextStage: 'mastery', indicators };
      }
      break;

    case 'mastery':
      indicators.push("Mastery stage reached");
      return { ready: false, indicators };

    case 'resistance':
      if (context.synthesis.resistanceLevel < 40) {
        indicators.push("Resistance decreasing");
      }
      if (context.mirror.geometryProfile.trend === 'improving') {
        indicators.push("Positive trajectory emerging");
      }
      if (indicators.length >= 2) {
        return { ready: true, nextStage: 'integration', indicators };
      }
      break;
  }

  return { ready: false, indicators };
}
