/**
 * Mirror Reflection Database Operations
 */

import { getDb } from "./db";
import { mirrorReflections, MirrorReflection, InsertMirrorReflection } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function saveMirrorReflection(
  userId: number,
  userInput: string,
  reflection: string,
  patterns: string[],
  unityScore: number,
  opportunityScore: number,
  resistanceLevel: number,
  nextStep: string
): Promise<MirrorReflection | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.insert(mirrorReflections).values({
      userId,
      userInput,
      reflection,
      patterns: JSON.stringify(patterns),
      unityScore,
      opportunityScore,
      resistanceLevel,
      nextStep,
    });

    const result = await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId))
      .orderBy(mirrorReflections.id)
      .limit(1);

    return result.length > 0 ? result[result.length - 1] : null;
  } catch (error) {
    console.error("[Database] Failed to save mirror reflection:", error);
    return null;
  }
}

export async function getMirrorHistory(userId: number, limit: number = 20): Promise<MirrorReflection[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId))
      .orderBy(mirrorReflections.createdAt)
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get mirror history:", error);
    return [];
  }
}

export async function getLatestMirrorReflection(userId: number): Promise<MirrorReflection | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(mirrorReflections)
      .where(eq(mirrorReflections.userId, userId))
      .orderBy(mirrorReflections.createdAt)
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get latest mirror reflection:", error);
    return null;
  }
}
