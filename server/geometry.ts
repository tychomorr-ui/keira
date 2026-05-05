/**
 * Pythagorean Geometry Scoring Engine for Tesseract
 * Implements ancient geometry as modern harmony scoring
 */

const PHI = (1 + Math.sqrt(5)) / 2; // Golden Ratio: 1.6180339887...

/**
 * Golden Ratio Harmony Score
 * Measures how close a value is to perfect harmony (Phi)
 * Returns 0-100 where 100 is perfect harmony
 */
export function goldenHarmonyScore(value: number, ideal: number): number {
  if (ideal === 0) return 0;
  const ratio = value / ideal;
  const deviation = Math.abs(ratio - PHI);
  const score = Math.max(0, 100 - deviation * 100);
  return Math.round(score * 100) / 100;
}

/**
 * Pythagorean Theorem: Unity Score
 * Converts duality (a² + b²) into higher unity (c)
 * Represents how fragmented forces can return to wholeness
 */
export function unityScore(dualityA: number, dualityB: number): number {
  const unityValue = Math.sqrt(dualityA ** 2 + dualityB ** 2);
  // Normalize to 0-100 scale (higher = closer to Monad/unity)
  const normalized = Math.min(100, Math.max(0, (unityValue / 10) * 100));
  return Math.round(normalized * 100) / 100;
}

/**
 * Vesica Piscis: Malleable Opportunity Layer
 * Measures the "overlap space" where two realities meet
 * Returns 0-100 where higher = more opportunity for creation
 */
export function vesicaPiscisOpportunity(
  circleA: number,
  circleB: number,
  distance: number
): number {
  // No overlap - separate realities
  if (distance >= circleA + circleB) {
    return 0;
  }

  // Full overlap - total fusion
  if (distance <= Math.abs(circleA - circleB)) {
    return 100;
  }

  // Partial overlap - calculate the lens area
  const overlapRatio = (circleA + circleB - distance) / Math.max(circleA, circleB);
  const opportunity = Math.min(100, Math.max(0, overlapRatio * 100));
  return Math.round(opportunity * 100) / 100;
}

/**
 * Tetractys Descent/Ascent Scoring
 * The sacred pyramid: 1+2+3+4 = 10 (return to unity)
 * Measures progress through the four levels of manifestation
 */
export function tetractysScore(level1: number, level2: number, level3: number, level4: number): number {
  const values = [level1, level2, level3, level4];
  const avg = values.reduce((a, b) => a + b, 0) / 4;
  const variance = values.reduce((sum, x) => sum + (x - avg) ** 2, 0) / 4;
  const harmony = Math.max(0, 100 - variance * 10);
  return Math.round(harmony * 100) / 100;
}

/**
 * Fibonacci Harmony
 * Natural growth pattern - measures alignment with organic expansion
 */
export function fibonacciHarmony(currentStep: number): number {
  const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 6765];
  if (currentStep >= fib.length) {
    return 100;
  }
  return Math.round((currentStep / fib.length) * 100 * 100) / 100;
}

/**
 * Resistance Level Calculation
 * Measures how much the user is resisting truth/transformation
 * Based on contradiction detection and pattern analysis
 */
export function calculateResistanceLevel(
  contradictionCount: number,
  defensivenessScore: number,
  avoidancePatterns: number
): number {
  // Weighted calculation
  const resistance =
    contradictionCount * 20 + // Contradictions are major resistance indicators
    defensivenessScore * 0.3 + // Defensiveness is moderate
    avoidancePatterns * 15; // Avoidance patterns are strong indicators

  return Math.min(100, Math.max(0, Math.round(resistance * 100) / 100));
}

/**
 * Phoenix Trigger
 * Determines if transformation/rebirth is needed
 * Returns true if unity score is too low (fragmentation too high)
 */
export function phoenixTrigger(unityScoreValue: number, resistanceLevel: number): boolean {
  // If unity is very low AND resistance is high, Phoenix protocol is needed
  return unityScoreValue < 35 && resistanceLevel > 40;
}

/**
 * Composite Harmony Score
 * Combines all Pythagorean metrics into a single coherence score
 */
export function compositeHarmonyScore(
  unityScoreValue: number,
  opportunityScore: number,
  resistanceLevel: number,
  tetractysValue: number
): number {
  // Weighted average of all harmony metrics
  const composite =
    unityScoreValue * 0.3 + // Unity is primary
    opportunityScore * 0.25 + // Opportunity is secondary
    (100 - resistanceLevel) * 0.25 + // Lower resistance = higher harmony
    tetractysValue * 0.2; // Tetractys balance is supporting

  return Math.round(composite * 100) / 100;
}

/**
 * Geometry Scoring Package
 * Complete analysis using all Pythagorean metrics
 */
export interface GeometryAnalysis {
  unityScore: number;
  opportunityScore: number;
  resistanceLevel: number;
  tetractysScore: number;
  compositeHarmony: number;
  phoenixNeeded: boolean;
  recommendation: string;
}

export function analyzeGeometry(
  dualityA: number,
  dualityB: number,
  distance: number,
  contradictions: number,
  defensiveness: number,
  avoidance: number,
  tetractysValues: [number, number, number, number]
): GeometryAnalysis {
  const unity = unityScore(dualityA, dualityB);
  const opportunity = vesicaPiscisOpportunity(dualityA, dualityB, distance);
  const resistance = calculateResistanceLevel(contradictions, defensiveness, avoidance);
  const tetractys = tetractysScore(...tetractysValues);
  const composite = compositeHarmonyScore(unity, opportunity, resistance, tetractys);
  const needsPhoenix = phoenixTrigger(unity, resistance);

  let recommendation = "";
  if (needsPhoenix) {
    recommendation = "PHOENIX PROTOCOL REQUIRED: Death, ashes, rebirth. No shortcut.";
  } else if (composite > 75) {
    recommendation = "Maintain alignment. You are in harmony.";
  } else if (composite > 50) {
    recommendation = "Increase coherence. Address contradictions. Reduce resistance.";
  } else {
    recommendation = "Fragmentation detected. Immediate alignment work required.";
  }

  return {
    unityScore: unity,
    opportunityScore: opportunity,
    resistanceLevel: resistance,
    tetractysScore: tetractys,
    compositeHarmony: composite,
    phoenixNeeded: needsPhoenix,
    recommendation,
  };
}
