/**
 * Portal Chat Router - Integrated Adaptive Response Engine
 * 
 * Combines context retrieval, learning stage classification, strategy selection,
 * and adaptive response generation for world-class Portal Chat.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as portalChat from "./portal-chat";
import { retrieveUserContext, formatContextForLLM } from "./portal-context-retrieval";
import { classifyLearningStage } from "./portal-stage-classifier";
import { selectDialogueStrategy } from "./portal-strategy-selector";
import { generateAdaptiveResponse, detectStageTransition } from "./portal-adaptive-response";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  initializecMAPSession,
  processcMAPMessage,
  extractLivingContext,
} from "./cmap-portal-integration";
import { updateMissionState, type MissionState } from "./cmap-handshake";

const cmapSessions = new Map<number, MissionState>(); // Keyed by conversationId

export const portalChatRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return await portalChat.getUserConversations(ctx.user.id);
  }),

  createConversation: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await portalChat.createConversation(ctx.user.id, input.title);
    }),

  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await portalChat.getConversation(input.conversationId, ctx.user.id);
      return {
        conversation: result.conversation,
        messages: result.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      };
    }),

  sendMessage: protectedProcedure
    .input(z.object({ conversationId: z.number(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { conversationId, message } = input;

      // Add user message
      await portalChat.addMessage(conversationId, ctx.user.id, "user", message);

      // cMAP is additive session awareness for the active Portal conversation.
      // State is intentionally in-memory until durable mission storage is added;
      // unavailable state is never represented as fabricated telemetry.
      let missionState = cmapSessions.get(conversationId);
      if (!missionState) {
        missionState = await initializecMAPSession(ctx.user.id);
      }
      missionState = processcMAPMessage(message, missionState).missionState;
      cmapSessions.set(conversationId, missionState);

      // Get user's creation date for context
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRecord.length) throw new Error("User not found");

      const userCreatedAt = userRecord[0].createdAt;

      // Retrieve comprehensive user context
      const userContext = await retrieveUserContext(ctx.user.id, userCreatedAt);

      // Classify learning stage
      const stageClassification = classifyLearningStage(userContext);

      // Select optimal dialogue strategy
      const strategySelection = selectDialogueStrategy(userContext, stageClassification);

      // Get conversation history for context
      const conversationResult = await portalChat.getConversation(conversationId, ctx.user.id);
      const recentMessages = conversationResult.messages.slice(-6).map((msg) => ({
        role: msg.role as 'user' | 'portal',
        content: msg.content,
      }));

      // Generate adaptive response
      const adaptiveResponse = await generateAdaptiveResponse(
        message,
        userContext,
        strategySelection,
        recentMessages
      );

      // Add Portal response
      await portalChat.addMessage(
        conversationId,
        ctx.user.id,
        "portal",
        adaptiveResponse.response
      );

      // Update learning memory with new insights
      const updates = adaptiveResponse.metadata.learningMemoryUpdates;
      if (Object.keys(updates).length > 0) {
        await portalChat.updateLearningMemory(ctx.user.id, updates);
      }

      // Check for stage transitions
      const stageTransition = detectStageTransition(adaptiveResponse.response, userContext);

      const livingContext = extractLivingContext(adaptiveResponse.response, missionState);
      missionState = updateMissionState(missionState, {
        ...livingContext,
        nextAction: adaptiveResponse.metadata.nextSuggestedAction || missionState.nextAction,
      });
      cmapSessions.set(conversationId, missionState);

      return {
        portalResponse: adaptiveResponse.response,
        metadata: {
          strategy: adaptiveResponse.strategy,
          learningStage: stageClassification.stage,
          breakthroughReadiness: userContext.synthesis.breakthroughReadiness,
          resistanceLevel: userContext.synthesis.resistanceLevel,
          stageTransition: stageTransition.isTransitioning ? stageTransition.nextStage : null,
          nextAction: adaptiveResponse.metadata.nextSuggestedAction,
          cmap: {
            sessionId: missionState.sessionId,
            handshakeComplete: true,
            missionIntent: missionState.missionIntent,
            missionStatus: missionState.missionStatus,
            decisions: missionState.decisions,
            evidence: missionState.evidence,
            openQuestions: missionState.openQuestions,
            nextAction: missionState.nextAction,
          },
        },
      };
    }),

  // New endpoint: Get user's learning profile
  getLearningProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!userRecord.length) throw new Error("User not found");

    const userContext = await retrieveUserContext(ctx.user.id, userRecord[0].createdAt);
    const stageClassification = classifyLearningStage(userContext);

    return {
      learningStage: stageClassification.stage,
      confidence: stageClassification.confidence,
      indicators: stageClassification.indicators,
      recommendations: stageClassification.recommendations,
      rationale: stageClassification.rationale,
      synthesis: userContext.synthesis,
      corePatterns: userContext.learning.corePatterns,
      growthAreas: userContext.learning.growthAreas,
      resistancePoints: userContext.learning.resistancePoints,
      breakthroughMoments: userContext.learning.breakthroughMoments,
      geometryProfile: userContext.mirror.geometryProfile,
    };
  }),

  // New endpoint: Get strategy analysis
  getStrategyAnalysis: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRecord.length) throw new Error("User not found");

      const userContext = await retrieveUserContext(ctx.user.id, userRecord[0].createdAt);
      const stageClassification = classifyLearningStage(userContext);
      const strategySelection = selectDialogueStrategy(userContext, stageClassification);

      return {
        strategy: strategySelection.strategy,
        rationale: strategySelection.rationale,
        guidelines: strategySelection.responseGuidelines,
        contextInjectionPoints: strategySelection.contextInjectionPoints,
      };
    }),
});
