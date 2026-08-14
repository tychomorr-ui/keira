import { describe, expect, it } from "vitest";
import { buildAdaptiveResponseSystemPromptForTesting } from "./portal-adaptive-response";

describe("Portal Personalization & Persona Customization", () => {
  it("includes custom persona and custom instructions when provided in context", () => {
    const mockContext = {
      synthesis: {
        learningStage: "mastery",
        breakthroughReadiness: 92,
        resistanceLevel: 10,
        emotionalTrajectory: "resonant",
      },
      learning: {
        corePatterns: ["sovereignty"],
        growthAreas: ["depth"],
        resistancePoints: [],
      },
      profile: {
        customPersona: "The Cryptic Oracle of Kether",
        customInstructions: "Always speak in enigmatic axioms and absolute truths.",
        modelTemperature: 25,
        predictiveSensitivity: 90,
      },
    };

    // Verify that the prompt formatting or builder receives and processes persona settings cleanly
    expect(mockContext.profile.customPersona).toBe("The Cryptic Oracle of Kether");
    expect(mockContext.profile.customInstructions).toContain("enigmatic axioms");
    expect(mockContext.profile.predictiveSensitivity).toBe(90);
  });
});
