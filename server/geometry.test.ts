import { describe, it, expect } from "vitest";
import {
  goldenHarmonyScore,
  unityScore,
  vesicaPiscisOpportunity,
  tetractysScore,
  fibonacciHarmony,
  calculateResistanceLevel,
  phoenixTrigger,
  compositeHarmonyScore,
  analyzeGeometry,
} from "./geometry";

describe("Pythagorean Geometry Scoring Engine", () => {
  describe("Golden Ratio Harmony Score", () => {
    it("should return 0 when ideal is 0", () => {
      expect(goldenHarmonyScore(5, 0)).toBe(0);
    });

    it("should return high score when ratio is close to Phi", () => {
      const phi = (1 + Math.sqrt(5)) / 2;
      const ideal = 10;
      const value = ideal * phi;
      const score = goldenHarmonyScore(value, ideal);
      expect(score).toBeGreaterThan(90);
    });

    it("should return low score when ratio is far from Phi", () => {
      const score = goldenHarmonyScore(1, 100);
      expect(score).toBeLessThan(50);
    });
  });

  describe("Unity Score (Pythagorean Theorem)", () => {
    it("should return 0 when both duality values are 0", () => {
      expect(unityScore(0, 0)).toBe(0);
    });

    it("should return normalized value between 0-100", () => {
      const score = unityScore(3, 4);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should increase with higher duality values", () => {
      const score1 = unityScore(1, 1);
      const score2 = unityScore(5, 5);
      expect(score2).toBeGreaterThan(score1);
    });

    it("should calculate correctly for 3-4-5 triangle", () => {
      // sqrt(3^2 + 4^2) = 5, normalized to 0-100 = 50
      const score = unityScore(3, 4);
      expect(score).toBeCloseTo(50, 0);
    });
  });

  describe("Vesica Piscis Opportunity Layer", () => {
    it("should return 0 when circles don't overlap", () => {
      expect(vesicaPiscisOpportunity(5, 5, 15)).toBe(0);
    });

    it("should return 100 when circles fully overlap", () => {
      expect(vesicaPiscisOpportunity(5, 5, 0)).toBe(100);
    });

    it("should return value between 0-100 for partial overlap", () => {
      const score = vesicaPiscisOpportunity(5, 5, 5);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should increase opportunity with closer distance", () => {
      const score1 = vesicaPiscisOpportunity(5, 5, 8);
      const score2 = vesicaPiscisOpportunity(5, 5, 4);
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe("Tetractys Score", () => {
    it("should return 100 when all four values are equal", () => {
      expect(tetractysScore(50, 50, 50, 50)).toBe(100);
    });

    it("should return lower score when values are unbalanced", () => {
      const balanced = tetractysScore(50, 50, 50, 50);
      const unbalanced = tetractysScore(100, 0, 100, 0);
      expect(unbalanced).toBeLessThan(balanced);
    });

    it("should return value between 0-100", () => {
      const score = tetractysScore(10, 20, 30, 40);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Fibonacci Harmony", () => {
    it("should return 0 for step 0", () => {
      expect(fibonacciHarmony(0)).toBe(0);
    });

    it("should return 100 for steps beyond sequence", () => {
      expect(fibonacciHarmony(100)).toBe(100);
    });

    it("should increase with step progression", () => {
      const score1 = fibonacciHarmony(5);
      const score2 = fibonacciHarmony(10);
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe("Resistance Level Calculation", () => {
    it("should return 0 when all inputs are 0", () => {
      expect(calculateResistanceLevel(0, 0, 0)).toBe(0);
    });

    it("should weight contradictions heavily", () => {
      const resistance1 = calculateResistanceLevel(5, 0, 0);
      const resistance2 = calculateResistanceLevel(0, 5, 0);
      expect(resistance1).toBeGreaterThan(resistance2);
    });

    it("should cap at 100", () => {
      expect(calculateResistanceLevel(100, 100, 100)).toBe(100);
    });

    it("should be non-negative", () => {
      expect(calculateResistanceLevel(-10, -10, -10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Phoenix Trigger", () => {
    it("should trigger when unity is low and resistance is high", () => {
      expect(phoenixTrigger(30, 50)).toBe(true);
    });

    it("should not trigger when unity is high", () => {
      expect(phoenixTrigger(80, 50)).toBe(false);
    });

    it("should not trigger when resistance is low", () => {
      expect(phoenixTrigger(30, 30)).toBe(false);
    });

    it("should not trigger when both are moderate", () => {
      expect(phoenixTrigger(50, 50)).toBe(false);
    });
  });

  describe("Composite Harmony Score", () => {
    it("should return value between 0-100", () => {
      const score = compositeHarmonyScore(50, 60, 40, 70);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should weight unity score most heavily", () => {
      // High unity, low resistance
      const score1 = compositeHarmonyScore(90, 10, 10, 10);
      // Low unity, high resistance
      const score2 = compositeHarmonyScore(10, 90, 90, 90);
      expect(score1).toBeGreaterThan(score2);
    });

    it("should decrease with higher resistance", () => {
      const score1 = compositeHarmonyScore(50, 50, 20, 50);
      const score2 = compositeHarmonyScore(50, 50, 80, 50);
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe("Full Geometry Analysis", () => {
    it("should return complete analysis package", () => {
      const analysis = analyzeGeometry(3, 4, 2, 2, 30, 1, [50, 50, 50, 50]);

      expect(analysis).toHaveProperty("unityScore");
      expect(analysis).toHaveProperty("opportunityScore");
      expect(analysis).toHaveProperty("resistanceLevel");
      expect(analysis).toHaveProperty("tetractysScore");
      expect(analysis).toHaveProperty("compositeHarmony");
      expect(analysis).toHaveProperty("phoenixNeeded");
      expect(analysis).toHaveProperty("recommendation");
    });

    it("should provide Phoenix recommendation when needed", () => {
      const analysis = analyzeGeometry(1, 1, 5, 5, 50, 3, [20, 20, 20, 20]);

      if (analysis.phoenixNeeded) {
        expect(analysis.recommendation).toContain("PHOENIX PROTOCOL");
      }
    });

    it("should provide harmony recommendation when composite is high", () => {
      const analysis = analyzeGeometry(8, 8, 2, 1, 10, 0, [80, 80, 80, 80]);

      if (analysis.compositeHarmony > 75) {
        expect(analysis.recommendation).toContain("harmony");
      }
    });

    it("should provide fragmentation warning when composite is low", () => {
      const analysis = analyzeGeometry(1, 1, 5, 5, 80, 5, [10, 10, 10, 10]);

      if (analysis.compositeHarmony < 50) {
        expect(analysis.recommendation).toMatch(/Fragmentation|PHOENIX/);
      }
    });
  });
});
