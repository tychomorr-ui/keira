/**
 * Trifecta Sentiment Analyzer
 * 
 * Analyzes user messages to detect:
 * - Emotional state (frustration, curiosity, urgency, contemplation)
 * - Urgency level (casual exploration vs. time-sensitive)
 * - Cognitive load (simple vs. complex thinking required)
 * - Openness to challenge (receptive vs. defensive)
 * - Response length preference (brief vs. elaborate)
 */

export interface SentimentAnalysis {
  emotionalState: "frustrated" | "curious" | "urgent" | "contemplative" | "neutral";
  urgencyLevel: number; // 0-1, where 1 is most urgent
  cognitiveLoad: number; // 0-1, where 1 is most complex thinking required
  opennessToChallengeLevel: number; // 0-1, where 1 is most open to challenge
  preferredResponseLength: "brief" | "moderate" | "elaborate";
  confidence: number; // 0-1, confidence in this analysis
  signals: string[]; // List of detected signals
}

/**
 * Emotional state keywords
 */
const emotionalSignals = {
  frustrated: [
    "frustrated",
    "stuck",
    "can't figure out",
    "doesn't work",
    "failing",
    "broken",
    "lost",
    "confused",
    "overwhelmed",
    "help",
    "please",
  ],
  curious: [
    "what if",
    "how does",
    "why",
    "curious",
    "wonder",
    "explore",
    "understand",
    "learn",
    "discover",
    "interesting",
    "fascinating",
  ],
  urgent: [
    "urgent",
    "asap",
    "immediately",
    "now",
    "quickly",
    "fast",
    "emergency",
    "critical",
    "deadline",
    "today",
    "tonight",
  ],
  contemplative: [
    "reflect",
    "ponder",
    "consider",
    "think about",
    "meditation",
    "deeper",
    "meaning",
    "purpose",
    "essence",
    "nature of",
  ],
};

/**
 * Urgency indicators
 */
const urgencyIndicators = {
  high: [
    "urgent",
    "asap",
    "immediately",
    "emergency",
    "critical",
    "deadline",
    "today",
    "now",
    "quickly",
  ],
  medium: [
    "soon",
    "this week",
    "before",
    "need to",
    "should",
    "important",
  ],
  low: [
    "eventually",
    "someday",
    "when you have time",
    "curious",
    "wondering",
  ],
};

/**
 * Cognitive load indicators
 */
const cognitiveLoadIndicators = {
  high: [
    "complex",
    "intricate",
    "sophisticated",
    "deep",
    "advanced",
    "multiple",
    "interconnected",
    "systemic",
    "holistic",
    "synthesis",
  ],
  low: [
    "simple",
    "basic",
    "quick",
    "brief",
    "simple",
    "straightforward",
    "easy",
    "quick answer",
  ],
};

/**
 * Challenge openness indicators
 */
const challengeOpennessIndicators = {
  high: [
    "challenge me",
    "push back",
    "disagree",
    "contrary",
    "devil's advocate",
    "test",
    "prove me wrong",
    "rigorous",
    "harsh",
  ],
  low: [
    "gentle",
    "supportive",
    "encouraging",
    "kind",
    "soft",
    "please be nice",
    "sensitive",
  ],
};

/**
 * Response length preference indicators
 */
const responseLengthIndicators = {
  brief: [
    "tldr",
    "quick",
    "short",
    "brief",
    "concise",
    "summary",
    "one sentence",
    "bullet points",
  ],
  elaborate: [
    "deep dive",
    "detailed",
    "comprehensive",
    "thorough",
    "full explanation",
    "everything",
    "all aspects",
  ],
};

/**
 * Analyze user message sentiment
 */
export function analyzeSentiment(message: string): SentimentAnalysis {
  const lowerMessage = message.toLowerCase();
  const signals: string[] = [];

  // Detect emotional state
  let emotionalState: "frustrated" | "curious" | "urgent" | "contemplative" | "neutral" = "neutral";
  let emotionalScore = 0;

  for (const [emotion, keywords] of Object.entries(emotionalSignals)) {
    const matches = keywords.filter(kw => lowerMessage.includes(kw)).length;
    if (matches > emotionalScore) {
      emotionalScore = matches;
      emotionalState = emotion as any;
      if (matches > 0) {
        signals.push(`emotional_state: ${emotion}`);
      }
    }
  }

  // Detect urgency level
  let urgencyLevel = 0;
  if (urgencyIndicators.high.some(kw => lowerMessage.includes(kw))) {
    urgencyLevel = 0.9;
    signals.push("urgency: high");
  } else if (urgencyIndicators.medium.some(kw => lowerMessage.includes(kw))) {
    urgencyLevel = 0.5;
    signals.push("urgency: medium");
  } else if (urgencyIndicators.low.some(kw => lowerMessage.includes(kw))) {
    urgencyLevel = 0.1;
    signals.push("urgency: low");
  }

  // Detect cognitive load
  let cognitiveLoad = 0.5; // Default to moderate
  if (cognitiveLoadIndicators.high.some(kw => lowerMessage.includes(kw))) {
    cognitiveLoad = 0.8;
    signals.push("cognitive_load: high");
  } else if (cognitiveLoadIndicators.low.some(kw => lowerMessage.includes(kw))) {
    cognitiveLoad = 0.2;
    signals.push("cognitive_load: low");
  }

  // Detect openness to challenge
  let opennessToChallengeLevel = 0.5; // Default to moderate
  if (challengeOpennessIndicators.high.some(kw => lowerMessage.includes(kw))) {
    opennessToChallengeLevel = 0.9;
    signals.push("openness_to_challenge: high");
  } else if (challengeOpennessIndicators.low.some(kw => lowerMessage.includes(kw))) {
    opennessToChallengeLevel = 0.2;
    signals.push("openness_to_challenge: low");
  }

  // Detect response length preference
  let preferredResponseLength: "brief" | "moderate" | "elaborate" = "moderate";
  if (responseLengthIndicators.brief.some(kw => lowerMessage.includes(kw))) {
    preferredResponseLength = "brief";
    signals.push("response_length: brief");
  } else if (responseLengthIndicators.elaborate.some(kw => lowerMessage.includes(kw))) {
    preferredResponseLength = "elaborate";
    signals.push("response_length: elaborate");
  }

  // Calculate confidence
  const confidence = Math.min(1, signals.length / 5);

  return {
    emotionalState,
    urgencyLevel,
    cognitiveLoad,
    opennessToChallengeLevel,
    preferredResponseLength,
    confidence,
    signals,
  };
}

/**
 * Get sentiment-based tone modifiers for system prompt
 */
export function getSentimentToneModifiers(sentiment: SentimentAnalysis): string {
  const modifiers: string[] = [];

  // Urgency-based modifiers
  if (sentiment.urgencyLevel > 0.7) {
    modifiers.push("Be concise and direct. The user is in a hurry.");
  } else if (sentiment.urgencyLevel < 0.3) {
    modifiers.push("Take your time. The user is in exploratory mode.");
  }

  // Emotional state modifiers
  switch (sentiment.emotionalState) {
    case "frustrated":
      modifiers.push("Acknowledge the frustration. Be empathetic but direct. Focus on solutions.");
      break;
    case "curious":
      modifiers.push("Match their curiosity. Explore possibilities. Ask questions that open new territory.");
      break;
    case "urgent":
      modifiers.push("Cut to the chase. Prioritize actionable insights.");
      break;
    case "contemplative":
      modifiers.push("Slow down. Invite deeper reflection. Use metaphor and nuance.");
      break;
  }

  // Cognitive load modifiers
  if (sentiment.cognitiveLoad > 0.7) {
    modifiers.push("Embrace complexity. The user can handle sophisticated ideas.");
  } else if (sentiment.cognitiveLoad < 0.3) {
    modifiers.push("Keep it simple. Use clear, straightforward language.");
  }

  // Challenge openness modifiers
  if (sentiment.opennessToChallengeLevel > 0.7) {
    modifiers.push("Don't hold back. Challenge assumptions. Be provocative if needed.");
  } else if (sentiment.opennessToChallengeLevel < 0.3) {
    modifiers.push("Be gentle. Avoid confrontation. Focus on support and encouragement.");
  }

  // Response length modifiers
  switch (sentiment.preferredResponseLength) {
    case "brief":
      modifiers.push("Keep responses concise. Use bullet points. Avoid lengthy explanations.");
      break;
    case "elaborate":
      modifiers.push("Go deep. Provide comprehensive explanations. Explore nuance and implications.");
      break;
  }

  return modifiers.join("\n");
}

/**
 * Score sentiment for persona matching
 * Returns a score for each persona type based on sentiment
 */
export function scorePersonasForSentiment(
  sentiment: SentimentAnalysis
): Record<string, number> {
  const scores: Record<string, number> = {
    "pragmatic-architect": 0,
    "exploratory-philosopher": 0,
    "socratic-challenger": 0,
    "catalytic-guide": 0,
    "forensic-analyst": 0,
    "prophetic-visionary": 0,
  };

  // Pragmatic Architect: High urgency, low cognitive load, action-oriented
  if (sentiment.urgencyLevel > 0.6) scores["pragmatic-architect"] += 0.3;
  if (sentiment.emotionalState === "frustrated") scores["pragmatic-architect"] += 0.3;
  if (sentiment.preferredResponseLength === "brief") scores["pragmatic-architect"] += 0.2;

  // Exploratory Philosopher: Curious, contemplative, elaborate responses
  if (sentiment.emotionalState === "curious") scores["exploratory-philosopher"] += 0.4;
  if (sentiment.emotionalState === "contemplative") scores["exploratory-philosopher"] += 0.3;
  if (sentiment.preferredResponseLength === "elaborate") scores["exploratory-philosopher"] += 0.2;

  // Socratic Challenger: High openness to challenge, cognitive load
  if (sentiment.opennessToChallengeLevel > 0.7) scores["socratic-challenger"] += 0.4;
  if (sentiment.cognitiveLoad > 0.6) scores["socratic-challenger"] += 0.3;
  if (sentiment.emotionalState === "frustrated") scores["socratic-challenger"] += 0.2;

  // Catalytic Guide: Low urgency, contemplative, low cognitive load
  if (sentiment.urgencyLevel < 0.3) scores["catalytic-guide"] += 0.3;
  if (sentiment.emotionalState === "contemplative") scores["catalytic-guide"] += 0.3;
  if (sentiment.preferredResponseLength === "brief") scores["catalytic-guide"] += 0.2;

  // Forensic Analyst: High cognitive load, detailed analysis needed
  if (sentiment.cognitiveLoad > 0.7) scores["forensic-analyst"] += 0.4;
  if (sentiment.preferredResponseLength === "elaborate") scores["forensic-analyst"] += 0.2;
  if (sentiment.emotionalState === "frustrated") scores["forensic-analyst"] += 0.2;

  // Prophetic Visionary: Curious, contemplative, elaborate
  if (sentiment.emotionalState === "curious") scores["prophetic-visionary"] += 0.3;
  if (sentiment.emotionalState === "contemplative") scores["prophetic-visionary"] += 0.3;
  if (sentiment.preferredResponseLength === "elaborate") scores["prophetic-visionary"] += 0.2;

  // Normalize scores
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    for (const key in scores) {
      scores[key] = scores[key] / maxScore;
    }
  }

  return scores;
}
