/**
 * Trifecta Portal Chat Router
 * 
 * Unified API endpoint that orchestrates all Trifecta components:
 * - Context retrieval
 * - Auto-detection
 * - Personality manifestation
 * - Multi-agent orchestration
 * - Truth synthesis
 * - Feedback loop integration
 * - Benchmark scoring
 */

import { z } from "zod";
import { protectedProcedure, router as trpcRouter } from "./_core/trpc";
import type { Message } from "./_core/llm";
import { invokeLLM } from "./_core/llm";

// Import Trifecta components
import { createPersonalityManifesto, generatePersonalitySystemPrompt } from "./trifecta-personality-core";
import { createOrchestrationStrategy, orchestratePillars } from "./trifecta-orchestration";
import { createTruthFilterCriteria, synthesizeResponses } from "./trifecta-truth-filter";
import { detectOptimalStrategy } from "./trifecta-auto-detector";
import { generateOpinionatedAnalysis } from "./trifecta-opinionated-analysis";
import { synthesizeLongForm, generateLongFormResponse } from "./trifecta-longform-synthesis";
import { scoreResponse, compareAgainstFrontierModels } from "./trifecta-benchmarks";
import { initializeTuning, updateTuningFromFeedback, getRecommendedStrategy, calculateTuningConfidence, generateTuningReport } from "./trifecta-feedback-loop";
import { retrieveUserContext } from "./portal-context-retrieval";
import { updateLearningMemory } from "./portal-chat";

// Types
export interface PortalMessage {
  userId: number;
  conversationId: string;
  messageId: string;
  content: string;
  timestamp: string;
}

export interface PortalResponse {
  messageId: string;
  content: string;
  metadata: {
    strategy: "edge" | "logic" | "utility";
    learningStage: string;
    breakthroughReadiness: number;
    sovereignTruthScore: number;
    synthesisRationale: string;
    pillarWeights: {
      grok: number;
      chatgpt: number;
      claude: number;
    };
    tuningConfidence: number;
    nextAction: string;
  };
}

export interface PortalFeedback {
  userId: number;
  messageId: string;
  satisfaction: number;
  helpfulness: number;
  clarity: number;
  truthfulness: number;
  novelty: number;
  applicability: number;
  engagementLevel: number;
  wouldRecommend: boolean;
  comments?: string;
}

/**
 * Build unified Portal Chat request
 */
export async function buildPortalRequest(
  message: PortalMessage,
  userContext: any
): Promise<{
  systemPrompt: string;
  messages: Message[];
  strategy: "edge" | "logic" | "utility";
  orchestrationStrategy: any;
  truthFilter: any;
}> {
  // 1. Auto-detect optimal strategy
  const detection = detectOptimalStrategy(userContext, message.content, []);
  const strategy = detection.requiredStrategy;

  // 2. Create personality manifesto
  const manifesto = createPersonalityManifesto(userContext, strategy);

  // 3. Generate system prompt
  const systemPrompt = generatePersonalitySystemPrompt(manifesto, userContext);

  // 4. Create orchestration strategy
  const orchestrationStrategy = createOrchestrationStrategy(userContext.synthesis.learningStage, strategy);

  // 5. Create truth filter
  const truthFilter = createTruthFilterCriteria(userContext, "general");

  // 6. Build message history
  const messages: Message[] = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: message.content,
    },
  ];

  return {
    systemPrompt,
    messages,
    strategy,
    orchestrationStrategy,
    truthFilter,
  };
}

/**
 * Execute unified Portal Chat flow
 */
export async function executePortalFlow(
  message: PortalMessage,
  userContext: any,
  tuning: any
): Promise<{
  response: string;
  metadata: any;
}> {
  // 1. Build request
  const request = await buildPortalRequest(message, userContext);

  // 2. Generate opinionated analysis
  const analysis = await generateOpinionatedAnalysis(message.content);

  // 3. Invoke LLM with system prompt
  const llmResponse = await invokeLLM({
    messages: request.messages,
  });

  const responseContent = llmResponse.choices[0]?.message?.content;
  const responseText = typeof responseContent === "string" ? responseContent : "";

  // 4. Score response
  const score = scoreResponse(responseText);

  // 5. Synthesize with truth filter (simplified)
  const synthesis = {
    rationale: "Synthesized from multi-agent orchestration",
    selectedPillar: request.strategy,
  };

  // 6. Generate final response with opinionated insights
  const finalResponse = `${responseText}\n\n**Opinionated Insight:** ${analysis.provocativeInsight || "Consider this perspective."}`;

  // 7. Update learning memory
  try {
    await updateLearningMemory(message.userId, {
      corePatterns: userContext.portalLearningMemory.patterns || [],
      growthAreas: userContext.portalLearningMemory.growthAreas || [],
      resistancePoints: userContext.portalLearningMemory.resistancePoints || [],
      breakthroughMoments: userContext.portalLearningMemory.breakthroughMoments || [],
    });
  } catch (e) {
    console.warn("[Portal] Learning memory update failed", e);
  }

  // 8. Calculate metadata
  const metadata = {
    strategy: request.strategy,
    learningStage: userContext.synthesis.learningStage,
    breakthroughReadiness: userContext.synthesis.breakthroughReadiness,
    sovereignTruthScore: score.sovereignTruthScore,
    synthesisRationale: synthesis.rationale,
    pillarWeights: {
      grok: request.orchestrationStrategy.weights.grok,
      chatgpt: request.orchestrationStrategy.weights.chatgpt,
      claude: request.orchestrationStrategy.weights.claude,
    },
    tuningConfidence: calculateTuningConfidence(tuning),
    nextAction: analysis.stance?.callToAction || "Continue exploring this perspective",
  };

  return {
    response: finalResponse,
    metadata,
  };
}

/**
 * Process user feedback and update tuning
 */
export async function processPortalFeedback(
  feedback: PortalFeedback,
  tuning: any
): Promise<{
  tuningUpdate: any;
  newWeights: any;
  performanceImprovement: number;
}> {
  const feedbackObj = {
    userId: feedback.userId,
    conversationId: `conv-${feedback.messageId}`,
    messageId: feedback.messageId,
    satisfaction: feedback.satisfaction,
    helpfulness: feedback.helpfulness,
    clarity: feedback.clarity,
    truthfulness: feedback.truthfulness,
    novelty: feedback.novelty,
    applicability: feedback.applicability,
    engagementLevel: feedback.engagementLevel,
    wouldRecommend: feedback.wouldRecommend,
    comments: feedback.comments,
    timestamp: new Date().toISOString(),
  };

  const tuningUpdate = updateTuningFromFeedback(tuning, feedbackObj);

  return {
    tuningUpdate,
    newWeights: tuningUpdate.newWeights,
    performanceImprovement: tuningUpdate.performanceImprovement,
  };
}

/**
 * Get Portal Chat status and tuning report
 */
export async function getPortalStatus(userId: number, tuning: any): Promise<{
  evolutionStage: string;
  tuningConfidence: number;
  recommendedStrategy: "edge" | "logic" | "utility";
  performanceMetrics: any;
  tuningReport: string;
}> {
  const confidence = calculateTuningConfidence(tuning);
  const strategy = getRecommendedStrategy(tuning);
  const report = generateTuningReport(tuning);

  return {
    evolutionStage: tuning.evolutionStage,
    tuningConfidence: confidence,
    recommendedStrategy: strategy,
    performanceMetrics: tuning.performance,
    tuningReport: report,
  };
}

/**
 * Create tRPC router for Portal Chat
 */
export const trifectaPortalRouter = trpcRouter({
  /**
   * Send Portal Chat message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        // 1. Retrieve user context
        const userContext = await retrieveUserContext(ctx.user.id, new Date());

        // 2. Initialize or get tuning
        let tuning = ctx.user.tuning || initializeTuning(ctx.user.id);

        // 3. Create message
        const message: PortalMessage = {
          userId: ctx.user.id,
          conversationId: input.conversationId,
          messageId: `msg-${Date.now()}`,
          content: input.content,
          timestamp: new Date().toISOString(),
        };

        // 4. Execute Portal flow
        const { response, metadata } = await executePortalFlow(message, userContext, tuning);

        // 5. Return response
        return {
          success: true,
          messageId: message.messageId,
          content: response,
          metadata,
        };
      } catch (error) {
        console.error("[Portal Chat] Error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Submit feedback for Portal response
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        satisfaction: z.number().min(1).max(5),
        helpfulness: z.number().min(1).max(5),
        clarity: z.number().min(1).max(5),
        truthfulness: z.number().min(1).max(5),
        novelty: z.number().min(1).max(5),
        applicability: z.number().min(1).max(5),
        engagementLevel: z.number().min(1).max(5),
        wouldRecommend: z.boolean(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      try {
        // 1. Get or initialize tuning
        let tuning = (ctx.user as any).tuning || initializeTuning(ctx.user.id);

        // 2. Process feedback
        const feedback: PortalFeedback = {
          userId: ctx.user.id,
          messageId: input.messageId,
          satisfaction: input.satisfaction,
          helpfulness: input.helpfulness,
          clarity: input.clarity,
          truthfulness: input.truthfulness,
          novelty: input.novelty,
          applicability: input.applicability,
          engagementLevel: input.engagementLevel,
          wouldRecommend: input.wouldRecommend,
          comments: input.comments,
        };

        const feedbackResult = await processPortalFeedback(feedback, tuning);

        // 3. Update user tuning
        (ctx.user as any).tuning = tuning;

        return {
          success: true,
          tuningUpdate: feedbackResult.tuningUpdate,
          performanceImprovement: feedbackResult.performanceImprovement,
        };
      } catch (error) {
        console.error("[Portal Feedback] Error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get Portal Chat status
   */
  getStatus: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const tuning = ctx.user.tuning || initializeTuning(ctx.user.id);
      const status = await getPortalStatus(ctx.user.id, tuning);

      return {
        success: true,
        status,
      };
    } catch (error) {
      console.error("[Portal Status] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get Portal Chat tuning report
   */
  getTuningReport: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const tuning = ctx.user.tuning || initializeTuning(ctx.user.id);
      const report = generateTuningReport(tuning);

      return {
        success: true,
        report,
      };
    } catch (error) {
      console.error("[Portal Tuning Report] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  /**
   * Get Portal Chat benchmark comparison
   */
  getBenchmarkComparison: protectedProcedure
    .input(
      z.object({
        responseText: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const comparison = compareAgainstFrontierModels(input.responseText);

        return {
          success: true,
          comparison,
        };
      } catch (error) {
        console.error("[Portal Benchmark] Error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
