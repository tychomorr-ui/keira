/**
 * Trifecta Persona Tracking System
 * 
 * Tracks which personas were used during high-satisfaction interactions
 * and weights them more heavily for future similar queries.
 * 
 * Creates a feedback-driven evolution where Portal's conversational
 * style adapts based on what actually resonates with the user.
 */

import type { PersonaType } from "./trifecta-personalities";

export interface PersonaPerformanceMetrics {
  personaId: PersonaType;
  totalUsage: number; // How many times used
  highSatisfactionCount: number; // Interactions rated 4-5
  averageSatisfaction: number; // Average satisfaction rating
  averageTruthfulness: number; // Average truthfulness rating
  averageNovelty: number; // Average novelty rating
  averageApplicability: number; // Average applicability rating
  lastUsedAt: Date;
  evolutionWeight: number; // 0-1, how much to favor this persona
}

export interface PersonaEvolutionProfile {
  userId: number;
  personaMetrics: Map<PersonaType, PersonaPerformanceMetrics>;
  preferredPersonas: PersonaType[]; // Top 3 personas by weight
  lastUpdatedAt: Date;
  totalInteractions: number;
}

/**
 * Initialize persona tracking for user
 */
export function initializePersonaTracking(userId: number): PersonaEvolutionProfile {
  const personaMetrics = new Map<PersonaType, PersonaPerformanceMetrics>();

  const personas: PersonaType[] = [
    "pragmatic-architect",
    "exploratory-philosopher",
    "socratic-challenger",
    "catalytic-guide",
    "forensic-analyst",
    "prophetic-visionary",
  ];

  for (const personaId of personas) {
    personaMetrics.set(personaId, {
      personaId,
      totalUsage: 0,
      highSatisfactionCount: 0,
      averageSatisfaction: 3,
      averageTruthfulness: 3,
      averageNovelty: 3,
      averageApplicability: 3,
      lastUsedAt: new Date(),
      evolutionWeight: 1 / personas.length, // Equal weight initially
    });
  }

  return {
    userId,
    personaMetrics,
    preferredPersonas: personas,
    lastUpdatedAt: new Date(),
    totalInteractions: 0,
  };
}

/**
 * Record persona usage and feedback
 */
export function recordPersonaFeedback(
  profile: PersonaEvolutionProfile,
  personaId: PersonaType,
  feedback: {
    satisfaction: number; // 1-5
    truthfulness: number; // 1-5
    novelty: number; // 1-5
    applicability: number; // 1-5
  }
): void {
  const metrics = profile.personaMetrics.get(personaId);
  if (!metrics) {
    return;
  }

  // Update metrics
  metrics.totalUsage += 1;
  if (feedback.satisfaction >= 4) {
    metrics.highSatisfactionCount += 1;
  }

  // Update averages (exponential moving average)
  const alpha = 0.3; // Weight for new data
  metrics.averageSatisfaction = metrics.averageSatisfaction * (1 - alpha) + feedback.satisfaction * alpha;
  metrics.averageTruthfulness = metrics.averageTruthfulness * (1 - alpha) + feedback.truthfulness * alpha;
  metrics.averageNovelty = metrics.averageNovelty * (1 - alpha) + feedback.novelty * alpha;
  metrics.averageApplicability = metrics.averageApplicability * (1 - alpha) + feedback.applicability * alpha;

  metrics.lastUsedAt = new Date();

  // Update evolution weight
  updateEvolutionWeight(metrics);

  // Update profile
  profile.lastUpdatedAt = new Date();
  profile.totalInteractions += 1;

  // Recalculate preferred personas
  updatePreferredPersonas(profile);
}

/**
 * Update evolution weight based on performance
 */
function updateEvolutionWeight(metrics: PersonaPerformanceMetrics): void {
  // Weight is based on:
  // - High satisfaction count (40%)
  // - Average satisfaction (30%)
  // - Average novelty (20%)
  // - Average applicability (10%)

  const satisfactionScore = (metrics.highSatisfactionCount / Math.max(metrics.totalUsage, 1)) * 0.4;
  const avgSatisfactionScore = (metrics.averageSatisfaction / 5) * 0.3;
  const noveltyScore = (metrics.averageNovelty / 5) * 0.2;
  const applicabilityScore = (metrics.averageApplicability / 5) * 0.1;

  metrics.evolutionWeight = satisfactionScore + avgSatisfactionScore + noveltyScore + applicabilityScore;

  // Ensure weight is between 0 and 1
  metrics.evolutionWeight = Math.max(0, Math.min(1, metrics.evolutionWeight));
}

/**
 * Update preferred personas list
 */
function updatePreferredPersonas(profile: PersonaEvolutionProfile): void {
  const sorted = Array.from(profile.personaMetrics.values())
    .sort((a, b) => b.evolutionWeight - a.evolutionWeight)
    .slice(0, 3)
    .map(m => m.personaId);

  profile.preferredPersonas = sorted;
}

/**
 * Get persona weights for selection
 */
export function getPersonaWeights(profile: PersonaEvolutionProfile): Record<PersonaType, number> {
  const weights: Record<PersonaType, number> = {} as any;

  let totalWeight = 0;
  profile.personaMetrics.forEach((metrics) => {
    totalWeight += metrics.evolutionWeight;
  });

  profile.personaMetrics.forEach((metrics, personaId) => {
    weights[personaId as PersonaType] = totalWeight > 0 ? metrics.evolutionWeight / totalWeight : 1 / 6;
  });

  return weights;
}

/**
 * Select persona based on evolution profile
 */
export function selectPersonaByEvolution(
  profile: PersonaEvolutionProfile,
  sentimentScores?: Record<string, number>
): PersonaType {
  const weights = getPersonaWeights(profile);

  // If sentiment scores provided, blend with evolution weights
  if (sentimentScores) {
    const blendedWeights: Record<PersonaType, number> = {} as any;
    Object.keys(weights).forEach((personaId) => {
      const pid = personaId as PersonaType;
      const evolutionWeight = weights[pid] || 0;
      const sentimentWeight = sentimentScores[pid] || 0;
      blendedWeights[pid] = evolutionWeight * 0.6 + sentimentWeight * 0.4;
    });

    // Select persona by weighted random
    return selectPersonaByWeightedRandom(blendedWeights);
  }

  // Select persona by evolution weights only
  return selectPersonaByWeightedRandom(weights);
}

/**
 * Select persona by weighted random
 */
function selectPersonaByWeightedRandom(weights: Record<PersonaType, number>): PersonaType {
  let totalWeight = 0;
  for (const weight of Object.values(weights)) {
    totalWeight += weight;
  }

  let random = Math.random() * totalWeight;
  for (const personaId of Object.keys(weights)) {
    const pid = personaId as PersonaType;
    const weight = weights[pid];
    random -= weight;
    if (random <= 0) {
      return pid;
    }
  }

  // Fallback
  return Object.keys(weights)[0] as PersonaType;
}

/**
 * Get persona performance report
 */
export function getPersonaPerformanceReport(profile: PersonaEvolutionProfile): string {
  let report = "## Persona Performance Report\n\n";

  const sorted = Array.from(profile.personaMetrics.values())
    .sort((a, b) => b.evolutionWeight - a.evolutionWeight);

  for (const metrics of sorted) {
    const satisfactionRate = metrics.totalUsage > 0 
      ? (metrics.highSatisfactionCount / metrics.totalUsage * 100).toFixed(0)
      : "0";

    report += `### ${metrics.personaId}\n`;
    report += `- Total Usage: ${metrics.totalUsage}\n`;
    report += `- High Satisfaction Rate: ${satisfactionRate}%\n`;
    report += `- Average Satisfaction: ${metrics.averageSatisfaction.toFixed(1)}/5\n`;
    report += `- Average Truthfulness: ${metrics.averageTruthfulness.toFixed(1)}/5\n`;
    report += `- Average Novelty: ${metrics.averageNovelty.toFixed(1)}/5\n`;
    report += `- Average Applicability: ${metrics.averageApplicability.toFixed(1)}/5\n`;
    report += `- Evolution Weight: ${(metrics.evolutionWeight * 100).toFixed(1)}%\n\n`;
  }

  report += `### Overall\n`;
  report += `- Total Interactions: ${profile.totalInteractions}\n`;
  report += `- Preferred Personas: ${profile.preferredPersonas.join(", ")}\n`;

  return report;
}

/**
 * Export persona profile for persistence
 */
export function exportPersonaProfile(profile: PersonaEvolutionProfile): string {
  const personaMetricsArray: any[] = [];
  profile.personaMetrics.forEach((metrics, personaId) => {
    personaMetricsArray.push({
      personaId,
      totalUsage: metrics.totalUsage,
      highSatisfactionCount: metrics.highSatisfactionCount,
      averageSatisfaction: metrics.averageSatisfaction,
      averageTruthfulness: metrics.averageTruthfulness,
      averageNovelty: metrics.averageNovelty,
      averageApplicability: metrics.averageApplicability,
      lastUsedAt: metrics.lastUsedAt.toISOString(),
      evolutionWeight: metrics.evolutionWeight,
    });
  });

  const data = {
    userId: profile.userId,
    totalInteractions: profile.totalInteractions,
    lastUpdatedAt: profile.lastUpdatedAt.toISOString(),
    personaMetrics: personaMetricsArray,
    preferredPersonas: profile.preferredPersonas,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import persona profile from persistence
 */
export function importPersonaProfile(data: string): PersonaEvolutionProfile {
  const parsed = JSON.parse(data);

  const personaMetrics = new Map<PersonaType, PersonaPerformanceMetrics>();
  for (const metric of parsed.personaMetrics) {
    personaMetrics.set(metric.personaId, {
      ...metric,
      lastUsedAt: new Date(metric.lastUsedAt),
    });
  }

  return {
    userId: parsed.userId,
    personaMetrics,
    preferredPersonas: parsed.preferredPersonas,
    lastUpdatedAt: new Date(parsed.lastUpdatedAt),
    totalInteractions: parsed.totalInteractions,
  };
}
