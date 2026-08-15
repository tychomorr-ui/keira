/**
 * Portal Adaptive Response Engine Tests
 * 
 * Tests for context retrieval, strategy selection, and adaptive response generation.
 */

import { describe, it, expect, beforeAll } from "vitest";
import type { UserContext } from "./portal-context-retrieval";
import { classifyLearningStage, isBreakthroughReady, isInResistanceCycle } from "./portal-stage-classifier";
import { classifyMessageIntent, getStrategySystemPrompt, selectDialogueStrategy } from "./portal-strategy-selector";
import { detectStageTransition } from "./portal-adaptive-response";

describe("Portal Adaptive Response Engine", () => {
  // Mock user context for testing
  const createMockContext = (overrides?: Partial<UserContext>): UserContext => {
    const defaultContext: UserContext = {
      userId: 1,
      mirror: {
        reflections: [],
        geometryProfile: {
          avgUnityScore: 50,
          avgOpportunityScore: 50,
          avgResistanceLevel: 60,
          trend: 'stable',
        },
        topPatterns: ['fear of visibility', 'perfectionism'],
        averageResistance: 60,
      },
      learning: {
        corePatterns: ['fear of visibility', 'perfectionism'],
        growthAreas: ['self-advocacy', 'authenticity'],
        resistancePoints: ['speaking up', 'being seen'],
        breakthroughMoments: [],
        evolutionTimeline: [],
        lastAnalyzedAt: null,
      },
      chatHistory: {
        recentConversations: [],
        recurringThemes: [],
        averageConversationLength: 0,
        totalConversations: 0,
      },
      metadata: {
        subscriptionTier: 'portal',
        subscriptionStatus: 'active',
        totalReflections: 5,
        totalChatMessages: 20,
        accountAgeInDays: 30,
        lastActivityAt: new Date(),
      },
      synthesis: {
        learningStage: 'exploration',
        activePatterns: ['fear of visibility', 'perfectionism'],
        breakthroughReadiness: 50,
        resistanceLevel: 60,
        emotionalTrajectory: 'stable',
        primaryFocus: 'fear of visibility',
        secondaryFocus: 'self-advocacy',
      },
    };

    return { ...defaultContext, ...overrides };
  };

  describe("Learning Stage Classification", () => {
    it("should classify awakening stage for new users", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 0 },
      });

      const classification = classifyLearningStage(context);

      expect(classification.stage).toBe('awakening');
      expect(classification.confidence).toBeGreaterThan(80);
    });

    it("should classify exploration stage for early users with patterns", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 3 },
        learning: { ...createMockContext().learning, corePatterns: ['pattern1', 'pattern2'] },
      });

      const classification = classifyLearningStage(context);

      expect(classification.stage).toBe('exploration');
      expect(classification.confidence).toBeGreaterThan(70);
    });

    it("should classify integration stage for established users", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 10 },
        learning: {
          ...createMockContext().learning,
          corePatterns: ['pattern1', 'pattern2', 'pattern3'],
          growthAreas: ['area1', 'area2'],
        },
        mirror: {
          ...createMockContext().mirror,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'improving' },
        },
      });

      const classification = classifyLearningStage(context);

      expect(classification.stage).toBe('integration');
    });

    it("should classify mastery stage for users with breakthroughs", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 15 },
        learning: {
          ...createMockContext().learning,
          breakthroughMoments: ['breakthrough1', 'breakthrough2'],
        },
        mirror: {
          ...createMockContext().mirror,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'improving' },
        },
      });

      const classification = classifyLearningStage(context);

      expect(classification.stage).toBe('mastery');
    });

    it("should classify resistance stage for high-resistance users", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 10 },
        synthesis: { ...createMockContext().synthesis, resistanceLevel: 80 },
        mirror: {
          ...createMockContext().mirror,
          averageResistance: 80,
        },
      });

      const classification = classifyLearningStage(context);

      expect(classification.stage).toBe('resistance');
    });
  });

  describe("Breakthrough Readiness", () => {
    it("should detect breakthrough readiness", () => {
      const context = createMockContext({
        learning: {
          ...createMockContext().learning,
          corePatterns: ['pattern1', 'pattern2'],
        },
        mirror: {
          ...createMockContext().mirror,
          averageResistance: 40,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'improving' },
        },
        metadata: { ...createMockContext().metadata, totalReflections: 8 },
        synthesis: { ...createMockContext().synthesis, emotionalTrajectory: 'ascending' },
      });

      expect(isBreakthroughReady(context)).toBe(true);
    });

    it("should not detect breakthrough readiness when resistance is high", () => {
      const context = createMockContext({
        mirror: {
          ...createMockContext().mirror,
          averageResistance: 75,
        },
        synthesis: { ...createMockContext().synthesis, resistanceLevel: 75 },
      });

      expect(isBreakthroughReady(context)).toBe(false);
    });
  });

  describe("Resistance Cycle Detection", () => {
    it("should detect resistance cycle", () => {
      const context = createMockContext({
        mirror: {
          ...createMockContext().mirror,
          averageResistance: 80,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'declining' },
        },
        learning: {
          ...createMockContext().learning,
          breakthroughMoments: [],
        },
        synthesis: { ...createMockContext().synthesis, emotionalTrajectory: 'descending' },
      });

      expect(isInResistanceCycle(context)).toBe(true);
    });

    it("should not detect resistance cycle when user is improving", () => {
      const context = createMockContext({
        mirror: {
          ...createMockContext().mirror,
          averageResistance: 40,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'improving' },
        },
        synthesis: { ...createMockContext().synthesis, emotionalTrajectory: 'ascending' },
      });

      expect(isInResistanceCycle(context)).toBe(false);
    });
  });

  describe("Strategy Selection", () => {
    it("uses an informative strategy for capability and factual requests regardless of learning stage", () => {
      const context = createMockContext({
        synthesis: { ...createMockContext().synthesis, learningStage: 'resistance' },
      });
      const classification = classifyLearningStage(context);

      const strategy = selectDialogueStrategy(context, classification, "Give me a concise breakdown of your capabilities");

      expect(strategy.strategy).toBe('informative');
      expect(strategy.responseGuidelines).toContain('Answer the direct question before adding interpretation');
    });

    it("keeps reflection available only when the operator explicitly invites it", () => {
      expect(classifyMessageIntent("Reflect on the deeper pattern in what I just said")).toBe('reflective');
      expect(classifyMessageIntent("Give me a system prompt for a technical assistant")).toBe('informative');
    });

    it("treats personal or spiritual statements respectfully without motive-assignment", () => {
      const context = createMockContext();
      const classification = classifyLearningStage(context);
      const strategy = selectDialogueStrategy(context, classification, "I see humanity as reflections of a creator and want to discuss that belief");
      const prompt = getStrategySystemPrompt(strategy.strategy, context);

      expect(strategy.strategy).toBe('informative');
      expect(strategy.responseGuidelines).toContain('Do not infer hidden motives, trauma, avoidance, or personal defects from ordinary wording');
      expect(prompt).toContain('Treat personal, spiritual, and unusual beliefs with respect');
      expect(prompt).toContain('without ridicule or interrogation');
    });

    it("should select Socratic strategy for exploration stage", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 3 },
        learning: {
          ...createMockContext().learning,
          corePatterns: ['pattern1', 'pattern2'],
        },
      });
      const classification = classifyLearningStage(context);

      const strategy = selectDialogueStrategy(context, classification, "Reflect on the deeper pattern in my current situation");

      expect(strategy.strategy).toBe('socratic');
    });

    it("should select Prophetic strategy for integration stage", () => {
      const context = createMockContext({
        synthesis: { ...createMockContext().synthesis, learningStage: 'integration' },
        metadata: { ...createMockContext().metadata, totalReflections: 10 },
      });
      const classification = classifyLearningStage(context);

      const strategy = selectDialogueStrategy(context, classification, "Reflect on the future path this pattern could create");

      expect(strategy.strategy).toBe('prophetic');
    });

    it("should select Forensic strategy for resistance stage", () => {
      const context = createMockContext({
        synthesis: { ...createMockContext().synthesis, learningStage: 'resistance' },
        mirror: { ...createMockContext().mirror, averageResistance: 80 },
      });
      const classification = classifyLearningStage(context);

      const strategy = selectDialogueStrategy(context, classification, "Challenge me about the contradiction in what I have been saying");

      expect(strategy.strategy).toBe('forensic');
    });

    it("should select Catalytic strategy for mastery stage", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 20 },
        learning: {
          ...createMockContext().learning,
          breakthroughMoments: ['breakthrough1', 'breakthrough2'],
        },
        mirror: {
          ...createMockContext().mirror,
          geometryProfile: { ...createMockContext().mirror.geometryProfile, trend: 'improving' },
        },
      });
      const classification = classifyLearningStage(context);

      const strategy = selectDialogueStrategy(context, classification, "Reflect on what I already know and what to do next");

      expect(strategy.strategy).toBe('catalytic');
    });
  });

  describe("Stage Transition Detection", () => {
    it("should detect transition from integration to mastery", () => {
      const context = createMockContext({
        synthesis: { ...createMockContext().synthesis, learningStage: 'integration' },
      });
      const response = "This is a breakthrough moment where you finally understand your pattern.";

      const transition = detectStageTransition(response, context);

      expect(transition.isTransitioning).toBe(true);
      expect(transition.nextStage).toBe('mastery');
    });

    it("should not detect transition without breakthrough language", () => {
      const context = createMockContext({
        synthesis: { ...createMockContext().synthesis, learningStage: 'exploration' },
      });
      const response = "Let's explore this pattern further.";

      const transition = detectStageTransition(response, context);

      expect(transition.isTransitioning).toBe(false);
    });
  });

  describe("Strategy Recommendations", () => {
    it("should provide appropriate recommendations for awakening stage", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 0 },
      });
      const classification = classifyLearningStage(context);

      expect(classification.recommendations.length).toBeGreaterThan(0);
      expect(classification.recommendations[0]).toContain('Answer direct questions first');
    });

    it("should provide appropriate recommendations for resistance stage", () => {
      const context = createMockContext({
        metadata: { ...createMockContext().metadata, totalReflections: 10 },
        mirror: { ...createMockContext().mirror, averageResistance: 80 },
        synthesis: { ...createMockContext().synthesis, resistanceLevel: 80 },
      });
      const classification = classifyLearningStage(context);

      expect(classification.recommendations.length).toBeGreaterThan(0);
      expect(classification.recommendations[0]).toContain('Do not interpret stage labels as a diagnosis');
    });
  });

  describe("Context Synthesis", () => {
    it("should correctly synthesize user context", () => {
      const context = createMockContext();

      expect(context.synthesis.learningStage).toBeDefined();
      expect(context.synthesis.breakthroughReadiness).toBeGreaterThanOrEqual(0);
      expect(context.synthesis.breakthroughReadiness).toBeLessThanOrEqual(100);
      expect(context.synthesis.resistanceLevel).toBeGreaterThanOrEqual(0);
      expect(context.synthesis.resistanceLevel).toBeLessThanOrEqual(100);
    });

    it("should track emotional trajectory", () => {
      const context = createMockContext();

      expect(['ascending', 'descending', 'stable']).toContain(context.synthesis.emotionalTrajectory);
    });
  });
});
