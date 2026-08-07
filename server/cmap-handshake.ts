import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface cMAPHandshakeResult {
  operatorId: number;
  sessionId: string;
  missionIntent: string;
  missionStatus: "active" | "paused" | "completed";
  nextAction: string;
  handshakeComplete: boolean;
}

export async function performArchangelHandshake(
  userId: number
): Promise<cMAPHandshakeResult> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Retrieve operator profile
  const operator = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!operator.length) {
    throw new Error("Operator not found");
  }

  // Generate session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Default mission intent
  const missionIntent = "Awaiting Intent";
  const missionStatus: "active" | "paused" | "completed" = "active";

  // Determine next recommended action
  const nextAction = "Establish primary mission objective";

  return {
    operatorId: userId,
    sessionId,
    missionIntent,
    missionStatus,
    nextAction,
    handshakeComplete: true,
  };
}

export interface MissionState {
  sessionId: string;
  missionIntent: string;
  missionStatus: "active" | "paused" | "completed";
  decisions: string[];
  evidence: string[];
  openQuestions: string[];
  nextAction: string;
}

export function createMissionState(
  sessionId: string,
  missionIntent: string
): MissionState {
  return {
    sessionId,
    missionIntent,
    missionStatus: "active",
    decisions: [],
    evidence: [],
    openQuestions: [],
    nextAction: "Continue mission execution",
  };
}

export function updateMissionState(
  state: MissionState,
  updates: Partial<MissionState>
): MissionState {
  return {
    ...state,
    ...updates,
  };
}

export function extractMissionIntent(userMessage: string): string {
  // Simple heuristic: extract first sentence as intent
  const sentences = userMessage.split(/[.!?]+/);
  return sentences[0]?.trim() || "Awaiting Intent";
}
