import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  portalConversations,
  portalChatMessages,
  portalLearningMemory,
  keiraContextEntries,
} from "../drizzle/schema";

export async function createConversation(
  userId: number,
  title: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(portalConversations).values({
    userId,
    title,
    messageCount: 0,
  });

  return result[0].insertId;
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(portalConversations)
    .where(eq(portalConversations.userId, userId))
    .orderBy(desc(portalConversations.lastMessageAt));
}

export async function getConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conversation = await db
    .select()
    .from(portalConversations)
    .where(eq(portalConversations.id, conversationId))
    .limit(1);

  if (!conversation.length || conversation[0].userId !== userId) {
    throw new Error("Conversation not found or unauthorized");
  }

  const messages = await db
    .select()
    .from(portalChatMessages)
    .where(eq(portalChatMessages.conversationId, conversationId))
    .orderBy(portalChatMessages.createdAt);

  return { conversation: conversation[0], messages };
}

export async function addMessage(
  conversationId: number,
  userId: number,
  role: "user" | "portal",
  content: string,
  patterns?: string[],
  emotionalTone?: string,
  growthIndicator?: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conversation = await db
    .select()
    .from(portalConversations)
    .where(eq(portalConversations.id, conversationId))
    .limit(1);

  if (!conversation.length || conversation[0].userId !== userId) {
    throw new Error("Conversation not found or unauthorized");
  }

  const result = await db.insert(portalChatMessages).values({
    conversationId,
    userId,
    role,
    content,
    patterns: patterns ? JSON.stringify(patterns) : null,
    emotionalTone,
    growthIndicator,
  });

  await db
    .update(portalConversations)
    .set({
      messageCount: conversation[0].messageCount + 1,
      lastMessageAt: new Date(),
    })
    .where(eq(portalConversations.id, conversationId));

  return result[0].insertId;
}

export async function getOrCreateLearningMemory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(portalLearningMemory)
    .where(eq(portalLearningMemory.userId, userId))
    .limit(1);

  if (existing.length) {
    return existing[0];
  }

  await db.insert(portalLearningMemory).values({
    userId,
    corePatterns: JSON.stringify([]),
    growthAreas: JSON.stringify([]),
    resistancePoints: JSON.stringify([]),
    breakthroughMoments: JSON.stringify([]),
    evolutionTimeline: JSON.stringify([]),
  });

  const created = await db
    .select()
    .from(portalLearningMemory)
    .where(eq(portalLearningMemory.userId, userId))
    .limit(1);

  return created[0];
}

export async function updateLearningMemory(
  userId: number,
  updates: {
    corePatterns?: string[];
    growthAreas?: string[];
    resistancePoints?: string[];
    breakthroughMoments?: string[];
    evolutionTimeline?: string[];
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    lastAnalyzedAt: new Date(),
  };

  if (updates.corePatterns) {
    updateData.corePatterns = JSON.stringify(updates.corePatterns);
  }
  if (updates.growthAreas) {
    updateData.growthAreas = JSON.stringify(updates.growthAreas);
  }
  if (updates.resistancePoints) {
    updateData.resistancePoints = JSON.stringify(updates.resistancePoints);
  }
  if (updates.breakthroughMoments) {
    updateData.breakthroughMoments = JSON.stringify(updates.breakthroughMoments);
  }
  if (updates.evolutionTimeline) {
    updateData.evolutionTimeline = JSON.stringify(updates.evolutionTimeline);
  }

  await db
    .update(portalLearningMemory)
    .set(updateData)
    .where(eq(portalLearningMemory.userId, userId));
}

export async function getContextEntries(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(keiraContextEntries)
    .where(eq(keiraContextEntries.userId, userId))
    .orderBy(desc(keiraContextEntries.updatedAt));
}

export async function createContextEntry(
  userId: number,
  entry: { label: string; content: string; kind: "fact" | "preference" | "goal" | "note" },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(keiraContextEntries).values({
    userId,
    label: entry.label,
    content: entry.content,
    kind: entry.kind,
    isActive: 1,
  });

  return result[0].insertId;
}

export async function setContextEntryActive(userId: number, entryId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const entry = await db
    .select()
    .from(keiraContextEntries)
    .where(eq(keiraContextEntries.id, entryId))
    .limit(1);

  if (!entry.length || entry[0].userId !== userId) {
    throw new Error("Context entry not found or unauthorized");
  }

  await db
    .update(keiraContextEntries)
    .set({ isActive: isActive ? 1 : 0 })
    .where(eq(keiraContextEntries.id, entryId));
}

export async function deleteContextEntry(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const entry = await db
    .select()
    .from(keiraContextEntries)
    .where(eq(keiraContextEntries.id, entryId))
    .limit(1);

  if (!entry.length || entry[0].userId !== userId) {
    throw new Error("Context entry not found or unauthorized");
  }

  await db.delete(keiraContextEntries).where(eq(keiraContextEntries.id, entryId));
}
