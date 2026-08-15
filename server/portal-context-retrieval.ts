/**
 * Portal Context Retrieval Engine
 * 
 * Synthesizes all user data (Mirror history, learning memory, chat history, knowledge graph)
 * into a unified context for adaptive response generation.
 */

import { getDb } from "./db";
import { 
  mirrorReflections, 
  portalLearningMemory, 
  portalConversations, 
  portalChatMessages,
  subscriptions 
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export interface MirrorData {
  reflections: Array<{
    id: number;
    userInput: string;
    reflection: string;
    patterns: string[];
    unityScore: number;
    opportunityScore: number;
    resistanceLevel: number;
    nextStep: string;
    createdAt: Date;
  }>;
  geometryProfile: {
    avgUnityScore: number;
    avgOpportunityScore: number;
    avgResistanceLevel: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  topPatterns: string[];
  averageResistance: number;
}

export interface LearningMemoryData {
  corePatterns: string[];
  growthAreas: string[];
  resistancePoints: string[];
  breakthroughMoments: string[];
  evolutionTimeline: string[];
  lastAnalyzedAt: Date | null;
}

export interface ChatHistoryData {
  recentConversations: Array<{
    id: number;
    title: string;
    messageCount: number;
    lastMessageAt: Date | null;
    createdAt: Date;
  }>;
  recurringThemes: string[];
  averageConversationLength: number;
  totalConversations: number;
}

export interface UserMetadata {
  subscriptionTier: 'mirror' | 'portal' | null;
  subscriptionStatus: string | null;
  totalReflections: number;
  totalChatMessages: number;
  accountAgeInDays: number;
  lastActivityAt: Date;
}

export interface UserContext {
  userId: number;
  mirror: MirrorData;
  learning: LearningMemoryData;
  chatHistory: ChatHistoryData;
  metadata: UserMetadata;
  synthesis: {
    learningStage: 'awakening' | 'exploration' | 'integration' | 'mastery' | 'resistance';
    activePatterns: string[];
    breakthroughReadiness: number; // 0-100
    resistanceLevel: number; // 0-100
    emotionalTrajectory: 'ascending' | 'descending' | 'stable';
    primaryFocus: string;
    secondaryFocus: string;
  };
}

/**
 * Retrieve Mirror history with geometry scores
 */
async function getMirrorData(userId: number): Promise<MirrorData> {
  const db = await getDb();
  if (!db) return { reflections: [], geometryProfile: { avgUnityScore: 0, avgOpportunityScore: 0, avgResistanceLevel: 0, trend: 'stable' }, topPatterns: [], averageResistance: 0 };

  try {
    const reflections = await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId))
      .orderBy(desc(mirrorReflections.createdAt))
      .limit(10);

    if (reflections.length === 0) {
      return { reflections: [], geometryProfile: { avgUnityScore: 0, avgOpportunityScore: 0, avgResistanceLevel: 0, trend: 'stable' }, topPatterns: [], averageResistance: 0 };
    }

    // Parse patterns from all reflections
    const allPatterns: string[] = [];
    reflections.forEach(r => {
      try {
        const patterns = JSON.parse(r.patterns || '[]');
        allPatterns.push(...patterns);
      } catch (e) {
        // Skip parsing errors
      }
    });

    // Count pattern frequencies
    const patternFreq = new Map<string, number>();
    allPatterns.forEach(p => {
      patternFreq.set(p, (patternFreq.get(p) || 0) + 1);
    });

    // Get top patterns
    const topPatterns = Array.from(patternFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([p]) => p);

    // Calculate geometry profile
    const avgUnityScore = reflections.reduce((sum, r) => sum + r.unityScore, 0) / reflections.length;
    const avgOpportunityScore = reflections.reduce((sum, r) => sum + r.opportunityScore, 0) / reflections.length;
    const avgResistanceLevel = reflections.reduce((sum, r) => sum + r.resistanceLevel, 0) / reflections.length;

    // Determine trend (comparing first half vs second half)
    const midpoint = Math.floor(reflections.length / 2);
    const firstHalfAvgResistance = reflections.slice(0, midpoint).reduce((sum, r) => sum + r.resistanceLevel, 0) / midpoint;
    const secondHalfAvgResistance = reflections.slice(midpoint).reduce((sum, r) => sum + r.resistanceLevel, 0) / (reflections.length - midpoint);
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvgResistance < firstHalfAvgResistance - 5) trend = 'improving';
    else if (secondHalfAvgResistance > firstHalfAvgResistance + 5) trend = 'declining';

    return {
      reflections: reflections.map(r => ({
        id: r.id,
        userInput: r.userInput,
        reflection: r.reflection,
        patterns: JSON.parse(r.patterns || '[]'),
        unityScore: r.unityScore,
        opportunityScore: r.opportunityScore,
        resistanceLevel: r.resistanceLevel,
        nextStep: r.nextStep,
        createdAt: r.createdAt,
      })),
      geometryProfile: {
        avgUnityScore: Math.round(avgUnityScore),
        avgOpportunityScore: Math.round(avgOpportunityScore),
        avgResistanceLevel: Math.round(avgResistanceLevel),
        trend,
      },
      topPatterns,
      averageResistance: Math.round(avgResistanceLevel),
    };
  } catch (error) {
    console.error("[Portal Context] Failed to get Mirror data:", error);
    return { reflections: [], geometryProfile: { avgUnityScore: 0, avgOpportunityScore: 0, avgResistanceLevel: 0, trend: 'stable' }, topPatterns: [], averageResistance: 0 };
  }
}

/**
 * Retrieve Portal learning memory
 */
async function getLearningMemoryData(userId: number): Promise<LearningMemoryData> {
  const db = await getDb();
  if (!db) return { corePatterns: [], growthAreas: [], resistancePoints: [], breakthroughMoments: [], evolutionTimeline: [], lastAnalyzedAt: null };

  try {
    const memory = await db
      .select()
      .from(portalLearningMemory)
      .where(eq(portalLearningMemory.userId, userId))
      .limit(1);

    if (memory.length === 0) {
      return { corePatterns: [], growthAreas: [], resistancePoints: [], breakthroughMoments: [], evolutionTimeline: [], lastAnalyzedAt: null };
    }

    const m = memory[0];
    return {
      corePatterns: JSON.parse(m.corePatterns || '[]'),
      growthAreas: JSON.parse(m.growthAreas || '[]'),
      resistancePoints: JSON.parse(m.resistancePoints || '[]'),
      breakthroughMoments: JSON.parse(m.breakthroughMoments || '[]'),
      evolutionTimeline: JSON.parse(m.evolutionTimeline || '[]'),
      lastAnalyzedAt: m.lastAnalyzedAt,
    };
  } catch (error) {
    console.error("[Portal Context] Failed to get learning memory:", error);
    return { corePatterns: [], growthAreas: [], resistancePoints: [], breakthroughMoments: [], evolutionTimeline: [], lastAnalyzedAt: null };
  }
}

/**
 * Retrieve Portal chat history
 */
async function getChatHistoryData(userId: number): Promise<ChatHistoryData> {
  const db = await getDb();
  if (!db) return { recentConversations: [], recurringThemes: [], averageConversationLength: 0, totalConversations: 0 };

  try {
    const conversations = await db
      .select()
      .from(portalConversations)
      .where(eq(portalConversations.userId, userId))
      .orderBy(desc(portalConversations.lastMessageAt))
      .limit(5);

    const allMessages = await db
      .select()
      .from(portalChatMessages)
      .where(eq(portalChatMessages.userId, userId));

    // Extract themes from recent user messages
    const recentUserMessages = allMessages
      .filter(m => m.role === 'user')
      .slice(-20)
      .map(m => m.content);

    // Simple theme extraction (words that appear frequently)
    const wordFreq = new Map<string, number>();
    recentUserMessages.forEach(msg => {
      const words = msg.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      words.forEach(w => {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      });
    });

    const recurringThemes = Array.from(wordFreq.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const avgConversationLength = conversations.length > 0
      ? conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length
      : 0;

    return {
      recentConversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
      })),
      recurringThemes,
      averageConversationLength: Math.round(avgConversationLength),
      totalConversations: conversations.length,
    };
  } catch (error) {
    console.error("[Portal Context] Failed to get chat history:", error);
    return { recentConversations: [], recurringThemes: [], averageConversationLength: 0, totalConversations: 0 };
  }
}

/**
 * Retrieve user metadata (subscription, activity)
 */
async function getUserMetadata(userId: number, createdAt: Date): Promise<UserMetadata> {
  const db = await getDb();
  if (!db) return { subscriptionTier: null, subscriptionStatus: null, totalReflections: 0, totalChatMessages: 0, accountAgeInDays: 0, lastActivityAt: new Date() };

  try {
    // Get subscription
    const sub = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    // Count reflections
    const reflectionCount = await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId));

    // Count chat messages
    const messageCount = await db
      .select()
      .from(portalChatMessages)
      .where(eq(portalChatMessages.userId, userId));

    const accountAgeInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      subscriptionTier: sub.length > 0 ? sub[0].tier : null,
      subscriptionStatus: sub.length > 0 ? sub[0].status : null,
      totalReflections: reflectionCount.length,
      totalChatMessages: messageCount.length,
      accountAgeInDays,
      lastActivityAt: new Date(),
    };
  } catch (error) {
    console.error("[Portal Context] Failed to get user metadata:", error);
    return { subscriptionTier: null, subscriptionStatus: null, totalReflections: 0, totalChatMessages: 0, accountAgeInDays: 0, lastActivityAt: new Date() };
  }
}

/**
 * Synthesize all data into learning stage and key insights
 */
function synthesizeContext(
  mirror: MirrorData,
  learning: LearningMemoryData,
  chatHistory: ChatHistoryData,
  metadata: UserMetadata
): UserContext['synthesis'] {
  // Determine learning stage based on activity and patterns
  let learningStage: 'awakening' | 'exploration' | 'integration' | 'mastery' | 'resistance' = 'awakening';
  
  if (metadata.totalReflections === 0) {
    learningStage = 'awakening';
  } else if (metadata.totalReflections < 5) {
    learningStage = 'exploration';
  } else if (learning.breakthroughMoments.length > 0) {
    learningStage = 'mastery';
  } else if (mirror.averageResistance > 70) {
    learningStage = 'resistance';
  } else {
    learningStage = 'integration';
  }

  // Determine emotional trajectory
  let emotionalTrajectory: 'ascending' | 'descending' | 'stable' = 'stable';
  if (mirror.geometryProfile.trend === 'improving') {
    emotionalTrajectory = 'ascending';
  } else if (mirror.geometryProfile.trend === 'declining') {
    emotionalTrajectory = 'descending';
  }

  // Determine breakthrough readiness
  let breakthroughReadiness = 0;
  if (learningStage === 'integration' && mirror.averageResistance < 50) {
    breakthroughReadiness = 75;
  } else if (learningStage === 'exploration' && learning.corePatterns.length > 3) {
    breakthroughReadiness = 50;
  } else if (learningStage === 'mastery') {
    breakthroughReadiness = 100;
  }

  // Active patterns (top patterns from Mirror)
  const activePatterns = mirror.topPatterns;

  // Primary and secondary focus
  const primaryFocus = learning.corePatterns[0] || 'Self-discovery';
  const secondaryFocus = learning.growthAreas[0] || 'Growth';

  return {
    learningStage,
    activePatterns,
    breakthroughReadiness,
    resistanceLevel: mirror.averageResistance,
    emotionalTrajectory,
    primaryFocus,
    secondaryFocus,
  };
}

/**
 * Main function: Retrieve complete user context
 */
export async function retrieveUserContext(userId: number, userCreatedAt: Date): Promise<UserContext> {
  try {
    const [mirror, learning, chatHistory, metadata] = await Promise.all([
      getMirrorData(userId),
      getLearningMemoryData(userId),
      getChatHistoryData(userId),
      getUserMetadata(userId, userCreatedAt),
    ]);

    const synthesis = synthesizeContext(mirror, learning, chatHistory, metadata);

    return {
      userId,
      mirror,
      learning,
      chatHistory,
      metadata,
      synthesis,
    };
  } catch (error) {
    console.error("[Portal Context] Failed to retrieve user context:", error);
    throw error;
  }
}

/**
 * Format context for LLM injection
 */
export function formatContextForLLM(context: UserContext): string {
  const lines: string[] = [];

  lines.push("=== USER CONTEXT ===\n");

  lines.push("This context is fallible background only. Do not infer motive, diagnosis, or hidden meaning from it.");
  lines.push("Answer the current operator request before using any contextual interpretation.");
  lines.push("");

  // Core patterns
  if (context.learning.corePatterns.length > 0) {
    lines.push(`Prior themes (optional): ${context.learning.corePatterns.join(", ")}`);
  }

  // Growth areas
  if (context.learning.growthAreas.length > 0) {
    lines.push(`Prior interests (optional): ${context.learning.growthAreas.join(", ")}`);
  }

  // Resistance points
  if (context.learning.resistancePoints.length > 0) {
    lines.push(`Prior challenges (optional): ${context.learning.resistancePoints.join(", ")}`);
  }

  lines.push("");

  lines.push(`Conversation history: ${context.metadata.totalChatMessages} persisted messages across ${context.chatHistory.totalConversations} conversations.`);

  lines.push("\n=== END CONTEXT ===\n");

  return lines.join("\n");
}
