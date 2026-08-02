/**
 * Trifecta Contextual Opening Logic
 * 
 * Generates contextually aware opening statements that acknowledge:
 * - Prior conversation history
 * - User's learning stage and progress
 * - Recurring themes and patterns
 * - Breakthrough moments
 * - Current emotional state
 * 
 * This prevents the "generic chatbot" feel by making each response
 * feel like a continuation of an ongoing relationship.
 */

export interface ConversationContext {
  messageCount: number; // Total messages in conversation
  priorThemes: string[]; // Recurring themes from history
  lastBreakthrough?: string; // Most recent breakthrough
  learningStage: string; // User's current stage
  emotionalTrajectory: string; // User's emotional trend
  timeGap?: number; // Hours since last message
  resistanceLevel: number; // Current resistance (0-1)
  breakthroughReadiness: number; // Readiness for breakthrough (0-1)
}

/**
 * Generate contextual opening that acknowledges conversation history
 */
export function generateContextualOpening(
  context: ConversationContext,
  currentTheme: string
): string {
  const openings: string[] = [];

  // First message in conversation
  if (context.messageCount === 1) {
    return `We're starting fresh here. Let's explore this together.`;
  }

  // Acknowledge time gap
  if (context.timeGap && context.timeGap > 24) {
    openings.push(`We last spoke ${Math.floor(context.timeGap / 24)} days ago.`);
  } else if (context.timeGap && context.timeGap > 1) {
    openings.push(`It's been a few hours since we last connected.`);
  }

  // Acknowledge recurring themes
  if (context.priorThemes.length > 0) {
    const theme = context.priorThemes[0];
    openings.push(`We keep returning to ${theme}. That's significant.`);
  }

  // Acknowledge learning stage progression
  if (context.messageCount > 10) {
    openings.push(`You're ${context.learningStage} now. Your thinking has deepened.`);
  }

  // Acknowledge emotional trajectory
  if (context.emotionalTrajectory === "ascending") {
    openings.push(`Your trajectory is upward. I notice the shift.`);
  } else if (context.emotionalTrajectory === "descending") {
    openings.push(`You seem to be in a dip. That's where the real work happens.`);
  }

  // Acknowledge recent breakthrough
  if (context.lastBreakthrough) {
    openings.push(`Since your breakthrough on ${context.lastBreakthrough}, something has shifted.`);
  }

  // Acknowledge resistance
  if (context.resistanceLevel > 0.7) {
    openings.push(`I sense significant resistance right now. That's protective, not problematic.`);
  }

  // Acknowledge breakthrough readiness
  if (context.breakthroughReadiness > 0.8) {
    openings.push(`You're on the edge of something. I can feel it.`);
  }

  // Pick the most relevant opening
  if (openings.length === 0) {
    return `Let's continue where we left off.`;
  }

  return openings[Math.floor(Math.random() * openings.length)];
}

/**
 * Generate opening that bridges to current theme
 */
export function generateThemeBridge(
  context: ConversationContext,
  currentTheme: string,
  priorTheme?: string
): string {
  if (!priorTheme) {
    return `Now you're asking about ${currentTheme}.`;
  }

  // Check if themes are related
  const themeConnections: Record<string, string[]> = {
    "identity": ["purpose", "meaning", "values", "authenticity"],
    "purpose": ["meaning", "direction", "legacy", "impact"],
    "meaning": ["purpose", "essence", "truth", "authenticity"],
    "relationships": ["communication", "boundaries", "vulnerability", "trust"],
    "communication": ["relationships", "understanding", "clarity", "connection"],
    "fear": ["resistance", "protection", "growth", "courage"],
    "resistance": ["fear", "protection", "avoidance", "breakthrough"],
    "growth": ["resistance", "fear", "courage", "transformation"],
  };

  const connections = themeConnections[priorTheme] || [];
  const isConnected = connections.includes(currentTheme);

  if (isConnected) {
    return `So from ${priorTheme}, you're moving to ${currentTheme}. That's a natural progression.`;
  } else {
    return `You're shifting from ${priorTheme} to ${currentTheme}. Interesting pivot.`;
  }
}

/**
 * Generate opening that acknowledges pattern recognition
 */
export function generatePatternAcknowledgment(
  patterns: string[],
  currentPattern?: string
): string {
  if (patterns.length === 0) {
    return `I'm noticing patterns emerging in how you think.`;
  }

  if (currentPattern && patterns.includes(currentPattern)) {
    return `There's that pattern again: ${currentPattern}. We've seen this before.`;
  }

  const patternList = patterns.slice(0, 2).join(" and ");
  return `I see recurring patterns: ${patternList}. They're worth examining.`;
}

/**
 * Generate opening that acknowledges growth
 */
export function generateGrowthAcknowledgment(
  messageCount: number,
  breakthroughCount: number,
  learningStage: string
): string {
  if (breakthroughCount === 0) {
    return `We're building foundation here. Patience is part of the process.`;
  }

  if (breakthroughCount === 1) {
    return `You've had your first real breakthrough. That changes things.`;
  }

  if (breakthroughCount > 3) {
    return `You've had multiple breakthroughs now. You're in transformation.`;
  }

  return `Your growth is visible. Keep going.`;
}

/**
 * Generate opening that creates continuity
 */
export function generateContinuityOpening(
  lastMessage: string,
  currentMessage: string
): string {
  // Check if current message is a follow-up question
  if (currentMessage.includes("?") && lastMessage.includes("?")) {
    return `You're digging deeper. Good.`;
  }

  // Check if current message challenges prior response
  if (
    currentMessage.toLowerCase().includes("but") ||
    currentMessage.toLowerCase().includes("however") ||
    currentMessage.toLowerCase().includes("disagree")
  ) {
    return `I hear the pushback. Let me reconsider.`;
  }

  // Check if current message is reflective
  if (
    currentMessage.toLowerCase().includes("think") ||
    currentMessage.toLowerCase().includes("realize") ||
    currentMessage.toLowerCase().includes("understand")
  ) {
    return `You're integrating. That's where transformation happens.`;
  }

  return `You're continuing the inquiry.`;
}

/**
 * Generate opening that honors the relationship
 */
export function generateRelationshipOpening(
  messageCount: number,
  trustLevel: number
): string {
  if (messageCount < 3) {
    return `We're just beginning to understand each other.`;
  }

  if (trustLevel < 0.3) {
    return `There's still some distance between us. That's okay.`;
  }

  if (trustLevel < 0.6) {
    return `We're building something here. Trust is developing.`;
  }

  if (trustLevel < 0.8) {
    return `There's real trust now. We can go deeper.`;
  }

  return `We've built something real. I know you.`;
}

/**
 * Combine multiple opening strategies
 */
export function buildContextualOpening(
  context: ConversationContext,
  currentTheme: string,
  priorTheme?: string,
  patterns: string[] = [],
  lastMessage?: string
): string {
  const components: string[] = [];

  // Add contextual acknowledgment
  if (context.messageCount > 1) {
    components.push(generateContextualOpening(context, currentTheme));
  }

  // Add theme bridge
  if (priorTheme && context.messageCount > 1) {
    components.push(generateThemeBridge(context, currentTheme, priorTheme));
  }

  // Add pattern acknowledgment
  if (patterns.length > 0) {
    components.push(generatePatternAcknowledgment(patterns, currentTheme));
  }

  // Add growth acknowledgment
  if (context.messageCount > 5) {
    components.push(generateGrowthAcknowledgment(context.messageCount, 0, context.learningStage));
  }

  // Combine and return
  return components.filter(c => c.length > 0).join(" ");
}
