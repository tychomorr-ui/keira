/**
 * Trifecta Portal Chat Router
 * 
 * Unified endpoint that orchestrates all Trifecta components:
 * - Personality Manifestation Layer (dynamic personas, sentiment analysis, contextual openings)
 * - Multi-Agent Orchestration (Grok/ChatGPT/Claude pillars)
 * - Sovereign Truth Filter (synthesis engine)
 * - Auto-Detection (Edge/Logic/Utility balance)
 * - Opinionated Analysis (real-time insights)
 * - Long-Form Synthesis (infinite-token coherence)
 * - Real-Time Feedback Loop (evolutionary tuning)
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
import { retrieveUserContext } from "./portal-context-retrieval";
import { updateLearningMemory } from "./portal-chat";
import { analyzeSentiment, scorePersonasForSentiment, getSentimentToneModifiers } from "./trifecta-sentiment-analyzer";
import { buildContextualOpening } from "./trifecta-contextual-opening";
import { applyVariabilityToPrompt, generateVariabilityConfig } from "./trifecta-conversation-variability";
import { getPersonality } from "./trifecta-personalities";
import { initializePersonaTracking, selectPersonaByEvolution, recordPersonaFeedback } from "./trifecta-persona-tracking";
import { createPersonalityManifesto, generatePersonalitySystemPrompt } from "./trifecta-personality-core";
import { performArchangelHandshake, createMissionState, updateMissionState, extractMissionIntent } from "./cmap-handshake";
import { initializecMAPSession, processcMAPMessage, extractLivingContext, buildcMAPContext } from "./cmap-portal-integration";
import { orchestratePillars } from "./trifecta-orchestration";
import { synthesizeResponses } from "./trifecta-truth-filter";
import { generateOpinionatedAnalysis } from "./trifecta-opinionated-analysis";
import { scoreResponse, compareAgainstFrontierModels } from "./trifecta-benchmarks";
import { initializeTuning, updateTuningFromFeedback, getRecommendedStrategy, calculateTuningConfidence, generateTuningReport } from "./trifecta-feedback-loop";

export interface PortalMessage {
  messageId: string;
  content: string;
  timestamp: Date;
}



/**
 * Build Portal request with Personality Manifestation Layer
 */
export async function buildPortalRequest(
  message: PortalMessage,
  userContext: any,
  personaProfile?: any
): Promise<{
  systemPrompt: string;
  messages: Message[];
  strategy: "edge" | "logic" | "utility";
  orchestrationStrategy: any;
  truthFilter: any;
  selectedPersona: any;
  contextualOpening: string;
  variabilityConfig: any;
}> {
  // 1. Auto-detect optimal strategy
  const strategy: "edge" | "logic" | "utility" = "logic"; // Default strategy

  // 2. Analyze user sentiment
  const sentiment = analyzeSentiment(message.content);
  const sentimentPersonaScores = scorePersonasForSentiment(sentiment);

  // 3. Select persona (blend sentiment + evolution tracking)
  let selectedPersonaId: any;
  if (personaProfile) {
    selectedPersonaId = selectPersonaByEvolution(personaProfile, sentimentPersonaScores);
  } else {
    // Fallback: select by sentiment alone
    const sorted = Object.entries(sentimentPersonaScores).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    );
    selectedPersonaId = sorted[0]?.[0] || "pragmatic-architect";
  }
  const selectedPersona = getPersonality(selectedPersonaId as any);

  // 4. Generate contextual opening
  const conversationContext = {
    messageCount: userContext.portalLearningMemory?.messageCount || 1,
    priorThemes: userContext.portalLearningMemory?.patterns || [],
    learningStage: userContext.synthesis.learningStage,
    emotionalTrajectory: userContext.synthesis.emotionalTrajectory || "neutral",
    resistanceLevel: userContext.synthesis.resistanceLevel || 0,
    breakthroughReadiness: userContext.synthesis.breakthroughReadiness || 0,
  };
  const contextualOpening = buildContextualOpening(
    conversationContext,
    "current inquiry",
    userContext.portalLearningMemory?.lastTheme
  );

  // 5. Generate conversation variability config
  const variabilityConfig = generateVariabilityConfig();

  // 6. Create personality manifesto
  const manifesto = createPersonalityManifesto(userContext, strategy);

  // 7. Generate base system prompt
  let systemPrompt = generatePersonalitySystemPrompt(manifesto, userContext);

  // 8. Enhance with personality profile
  systemPrompt += "\n\n" + selectedPersona.systemPromptTemplate;

  // 9. Add sentiment-based tone modifiers
  const sentimentModifiers = getSentimentToneModifiers(sentiment);
  systemPrompt += "\n\nTone Adjustments:\n" + sentimentModifiers;

  // 10. Apply conversation variability
  systemPrompt = applyVariabilityToPrompt(systemPrompt, variabilityConfig);

  // 11. Create orchestration strategy
  const orchestrationStrategy = {
    executionMode: "parallel" as const,
    weights: {
      grok: 0.33,
      chatgpt: 0.33,
      claude: 0.34,
    },
  };

  // 12. Create truth filter
  const truthFilter = {
    signalMetrics: {
      coherence: 0.9,
      novelty: 0.8,
      applicability: 0.85,
      truthfulness: 0.9,
    },
    domainBias: {
      technical: 0.4,
      creative: 0.3,
      provocative: 0.3,
    },
    stageBias: {
      awakening: 0.3,
      exploration: 0.25,
      integration: 0.2,
      mastery: 0.15,
      resistance: 0.1,
    },
  };

  // 13. Build message history with contextual opening
  const messages: Message[] = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: contextualOpening + "\n\n" + message.content,
    },
  ];

  return {
    systemPrompt,
    messages,
    strategy,
    orchestrationStrategy,
    truthFilter,
    selectedPersona,
    contextualOpening,
    variabilityConfig,
  };
}

/**
 * Execute unified Portal Chat flow
 */
export async function executePortalFlow(
  message: PortalMessage,
  userContext: any,
  tuning: any,
  personaProfile?: any
): Promise<{
  response: string;
  metadata: any;
}> {
  // 1. Build request with Personality Manifestation Layer
  const request = await buildPortalRequest(message, userContext, personaProfile);

  // 2. Generate opinionated analysis
  const analysis = await generateOpinionatedAnalysis(message.content);

  // 3. Execute multi-agent orchestration
  const userMessage = message.content;
  const context = JSON.stringify(userContext);
  const pillarResponses = await orchestratePillars(
    userMessage,
    context,
    request.messages,
    request.orchestrationStrategy
  );

  // 4. Synthesize responses through Sovereign Truth Filter
  const synthesis = await synthesizeResponses(
    pillarResponses,
    request.truthFilter,
    userContext
  );

  // 5. Score response
  const score = scoreResponse(synthesis.response);

  // 6. Update learning memory
  await updateLearningMemory(userContext.userId, {
    corePatterns: [],
    growthAreas: [],
    resistancePoints: [],
  });

  // 7. Calculate metadata
  const metadata = {
    strategy: request.strategy,
    learningStage: userContext.synthesis.learningStage,
    breakthroughReadiness: userContext.synthesis.breakthroughReadiness,
    sovereignTruthScore: score.sovereignTruthScore,
    synthesisRationale: synthesis.synthesis.synthesisRationale,
    pillarWeights: {
      grok: request.orchestrationStrategy.weights.grok,
      chatgpt: request.orchestrationStrategy.weights.chatgpt,
      claude: request.orchestrationStrategy.weights.claude,
    },
    tuningConfidence: calculateTuningConfidence(tuning),
    nextAction: analysis.stance?.callToAction || "Continue exploring this perspective",
    selectedPersona: request.selectedPersona.id,
    contextualOpening: request.contextualOpening,
    variabilityEntropy: request.variabilityConfig.entropy,
  };

  return {
    response: synthesis.response,
    metadata,
  };
}

/**
 * Process Portal Chat feedback
 */
export async function processPortalFeedback(
  feedback: any,
  tuning: any
): Promise<{
  success: boolean;
  tuningUpdated: boolean;
  newWeights: any;
}> {
  // 1. Update tuning from feedback
  const updated = updateTuningFromFeedback(feedback, tuning);

  // 2. Calculate new strategy recommendation
  const recommended = getRecommendedStrategy(tuning);

  return {
    success: true,
    tuningUpdated: updated ? true : false,
    newWeights: tuning.weights,
  };
}

/**
 * Trifecta Portal Chat Router
 */
export const portalChatRouter = router({
  sendMessage: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        messageId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      // 1. Retrieve user context
      const userContext = await retrieveUserContext((ctx.user as any).id, new Date((ctx.user as any).createdAt));

      // 2. Initialize tuning if needed
      let tuning = (ctx.user as any).tuning || initializeTuning((ctx.user as any).id);

      // 3. Create Portal message
      const message: PortalMessage = {
        messageId: input.messageId || `msg_${Date.now()}`,
        content: input.content,
        timestamp: new Date(),
      };

      // 4. Initialize cMAP session
      let missionState = (ctx.user as any).missionState || await initializecMAPSession((ctx.user as any).id);

      // 5. Process message with cMAP
      const cmapMessage = processcMAPMessage(message.content, missionState);
      missionState = cmapMessage.missionState;

      // 6. Build cMAP context for system prompt
      const cmapContext = buildcMAPContext(missionState);
      (userContext as any).cmapContext = cmapContext;

      // 7. Initialize or get persona profile
      let personaProfile = (ctx.user as any).personaProfile || initializePersonaTracking((ctx.user as any).id);

      // 8. Execute Portal flow with Personality Manifestation Layer
      const { response, metadata } = await executePortalFlow(message, userContext, tuning, personaProfile);

      // 9. Extract living context from response
      const livingContextUpdates = extractLivingContext(response, missionState);
      missionState = updateMissionState(missionState, livingContextUpdates);

      // 10. Store mission state and persona profile for future use
      (ctx.user as any).missionState = missionState;
      (ctx.user as any).personaProfile = personaProfile;

      // 11. Return response with cMAP and personality metadata
      return {
        success: true,
        messageId: message.messageId,
        content: response,
        metadata: {
          ...metadata,
          missionIntent: missionState.missionIntent,
          missionStatus: missionState.missionStatus,
          decisions: missionState.decisions,
          evidence: missionState.evidence,
          openQuestions: missionState.openQuestions,
          nextAction: missionState.nextAction,
        },
      };
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        personaId: z.string().optional(),
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
    .mutation(async ({ input, ctx }: any) => {
      // 1. Initialize tuning if needed
      let tuning = (ctx.user as any).tuning || initializeTuning((ctx.user as any).id);

      // 3. Process feedback
      const feedbackResult = await processPortalFeedback(input, tuning);

      // 4. Track persona performance
      let personaProfile = (ctx.user as any).personaProfile || initializePersonaTracking((ctx.user as any).id);
      const personaUsedInMessage = input.personaId || "pragmatic-architect";
      recordPersonaFeedback(personaProfile, personaUsedInMessage as any, {
        satisfaction: input.satisfaction,
        truthfulness: input.truthfulness,
        novelty: input.novelty,
        applicability: input.applicability,
      });

      // 5. Update user tuning and persona profile
      (ctx.user as any).tuning = tuning;
      (ctx.user as any).personaProfile = personaProfile;

      return {
        success: true,
        tuningUpdated: feedbackResult.tuningUpdated as any,
        newWeights: feedbackResult.newWeights,
      };
    }),

  getStatus: protectedProcedure.query(async ({ ctx }: any) => {
    const tuning = (ctx.user as any).tuning || initializeTuning((ctx.user as any).id);
    const personaProfile = (ctx.user as any).personaProfile || initializePersonaTracking((ctx.user as any).id);

    return {
      tuningConfidence: calculateTuningConfidence(tuning),
      evolutionStage: tuning.evolutionStage,
      preferredPersonas: personaProfile.preferredPersonas,
      totalInteractions: personaProfile.totalInteractions,
      tuningReport: generateTuningReport(tuning),
    };
  }),

  getBenchmarkComparison: protectedProcedure
    .input(
      z.object({
        responseContent: z.string(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const comparison = compareAgainstFrontierModels(input.responseContent);

      return {
        portal: comparison.portal,
        gpt4o: comparison.gpt4o,
        claudeOpus: comparison.claudeOpus,
        grok: comparison.grok,
      };
    }),
});
