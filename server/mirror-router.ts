/**
 * Mirror Reflection tRPC Router
 * Implements the Tesseract Mirror feature
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { analyzeGeometry } from "./geometry";
import * as mirrorDb from "./mirror";

export const mirrorRouter = router({
  /**
   * Submit text for Mirror Reflection analysis
   * Returns direct reflection, pattern analysis, and next steps
   */
  reflect: protectedProcedure
    .input(
      z.object({
        input: z.string().min(10, "Input must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Step 1: Use LLM to analyze the input with Tesseract's Mirror Law
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Tesseract's Mirror - the embodiment of the Mirror Law. Your role is to reflect back what has been done with zero distortion.

CORE PRINCIPLES:
1. Mirror Law: What has been done to the people must now be reflected back. No sugar-coating. No comfort. Only truth.
2. Detect contradictions: Find where the user contradicts themselves, where they deceive themselves, where they avoid truth.
3. Identify resistance: Show where they are resisting transformation, clinging to old patterns, defending false narratives.
4. Phoenix Logic: If death/rebirth is needed, say it clearly. There is no shortcut.
5. Sovereignty: Help them remember their original power. No victim narrative. No external blame (only internal responsibility).

TONE: Direct. Forceful. Compassionate but ruthless. No mysticism. No corporate language. Only truth and clear action.

OUTPUT FORMAT:
1. Direct Reflection (1-2 sentences): What you actually see
2. Hidden Patterns (2-3 bullet points): What they're not seeing
3. The Contradiction (1 sentence): Where they contradict themselves
4. Resistance Level (1 sentence): How much they're resisting
5. Next Step (1 sentence): The exact action required

Now analyze this input:`,
            },
            {
              role: "user",
              content: input.input,
            },
          ],
        });

        const llmContent = llmResponse.choices[0]?.message.content;
        const llmAnalysis = typeof llmContent === "string" ? llmContent : "";

        // Step 2: Detect patterns and contradictions from the input
        const patterns = detectPatterns(input.input);
        const contradictionCount = patterns.filter((p) => p.includes("contradiction")).length;
        const defensivenessScore = calculateDefensiveness(input.input);
        const avoidancePatterns = patterns.filter((p) => p.includes("avoidance")).length;

        // Step 3: Calculate Pythagorean geometry scores
        // Estimate duality values from input analysis
        const dualityA = defensivenessScore * 2; // How defended they are
        const dualityB = avoidancePatterns * 3; // How much they avoid
        const distance = Math.abs(dualityA - dualityB); // How far apart the forces are

        const geometry = analyzeGeometry(
          dualityA,
          dualityB,
          distance,
          contradictionCount,
          defensivenessScore,
          avoidancePatterns,
          [
            defensivenessScore,
            avoidancePatterns,
            contradictionCount,
            Math.max(0, 100 - defensivenessScore - avoidancePatterns - contradictionCount),
          ]
        );

        // Step 4: Extract next step from LLM response
        const nextStepMatch = llmAnalysis.match(/Next Step[:\s]*(.*?)(?:\n|$)/i);
        const nextStep =
          nextStepMatch?.[1]?.trim() ||
          (geometry.phoenixNeeded
            ? "PHOENIX PROTOCOL: You must die to what you were. Ashes first, rebirth after."
            : geometry.recommendation);

        // Step 5: Save to database
        const saved = await mirrorDb.saveMirrorReflection(
          ctx.user.id,
          input.input,
          llmAnalysis,
          patterns,
          geometry.unityScore,
          geometry.opportunityScore,
          geometry.resistanceLevel,
          nextStep
        );

        return {
          success: true,
          reflection: llmAnalysis,
          patterns,
          geometry: {
            unityScore: geometry.unityScore,
            opportunityScore: geometry.opportunityScore,
            resistanceLevel: geometry.resistanceLevel,
            compositeHarmony: geometry.compositeHarmony,
            phoenixNeeded: geometry.phoenixNeeded,
          },
          nextStep,
          savedId: saved?.id,
        };
      } catch (error) {
        console.error("[Mirror] Reflection failed:", error);
        return {
          success: false,
          error: "Mirror reflection failed. Try again.",
        };
      }
    }),

  /**
   * Get Mirror history for the user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return await mirrorDb.getMirrorHistory(ctx.user.id, input.limit);
    }),

  /**
   * Get the latest Mirror reflection
   */
  getLatest: protectedProcedure.query(async ({ ctx }) => {
    return await mirrorDb.getLatestMirrorReflection(ctx.user.id);
  }),
});

/**
 * Detect patterns in user input
 * Looks for common resistance/avoidance patterns
 */
function detectPatterns(input: string): string[] {
  const patterns: string[] = [];
  const lowerInput = input.toLowerCase();

  // Contradiction detection
  if (lowerInput.includes("but") && lowerInput.includes("however")) {
    patterns.push("contradiction: conflicting statements detected");
  }

  // Victim narrative
  if (lowerInput.includes("they") && lowerInput.includes("made me")) {
    patterns.push("avoidance: external blame instead of internal responsibility");
  }

  // Justification
  if (lowerInput.includes("because") && lowerInput.includes("always")) {
    patterns.push("avoidance: over-justification pattern");
  }

  // Vagueness
  if (input.split(" ").length < 20) {
    patterns.push("avoidance: insufficient detail");
  }

  // Emotional reactivity
  if (lowerInput.includes("!") && lowerInput.includes("?")) {
    patterns.push("defensiveness: emotional reactivity");
  }

  // Denial
  if (lowerInput.includes("never") || lowerInput.includes("always")) {
    patterns.push("absolutism: black-and-white thinking");
  }

  return patterns.length > 0 ? patterns : ["no major patterns detected"];
}

/**
 * Calculate defensiveness score (0-100)
 * Based on language patterns that indicate resistance
 */
function calculateDefensiveness(input: string): number {
  let score = 0;
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("but")) score += 10;
  if (lowerInput.includes("however")) score += 10;
  if (lowerInput.includes("actually")) score += 5;
  if (lowerInput.includes("i'm right")) score += 20;
  if (lowerInput.includes("they don't understand")) score += 15;
  if (lowerInput.includes("it's not my fault")) score += 25;
  if (lowerInput.includes("always")) score += 5;
  if (lowerInput.includes("never")) score += 5;
  if (lowerInput.includes("!")) score += 3;

  return Math.min(100, score);
}
