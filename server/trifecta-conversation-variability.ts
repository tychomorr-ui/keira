/**
 * Trifecta Conversation Variability Engine
 * 
 * Introduces natural entropy into Portal responses to prevent:
 * - Robotic repetition of similar sentence patterns
 * - Predictable response structures
 * - Generic, templated language
 * 
 * Uses randomization (0.1-0.3 entropy coefficient) to vary:
 * - Sentence structure and pacing
 * - Vocabulary and word choice
 * - Formality and tone
 * - Depth and elaboration
 * - Use of examples, metaphors, and analogies
 */

export interface VariabilityConfig {
  entropy: number; // 0.1-0.3, controls randomness
  formality: number; // 0-1, controls formal vs casual language
  brevity: number; // 0-1, controls conciseness vs elaboration
  metaphorUsage: number; // 0-1, controls use of metaphors
  exampleFrequency: number; // 0-1, controls use of examples
}

/**
 * Generate random variability config
 */
export function generateVariabilityConfig(): VariabilityConfig {
  const entropy = 0.1 + Math.random() * 0.2; // 0.1-0.3

  return {
    entropy,
    formality: Math.random(),
    brevity: Math.random(),
    metaphorUsage: Math.random(),
    exampleFrequency: Math.random(),
  };
}

/**
 * Variability modifiers for system prompt
 */
export function getVariabilityModifiers(config: VariabilityConfig): string {
  const modifiers: string[] = [];

  // Formality modifiers
  if (config.formality > 0.7) {
    modifiers.push("Use formal, academic language. Precise terminology.");
  } else if (config.formality < 0.3) {
    modifiers.push("Use conversational, casual language. Natural phrasing.");
  } else {
    modifiers.push("Use balanced, professional language.");
  }

  // Brevity modifiers
  if (config.brevity > 0.7) {
    modifiers.push("Be concise. Use short sentences. Get to the point.");
  } else if (config.brevity < 0.3) {
    modifiers.push("Elaborate freely. Use longer, flowing sentences. Explore nuance.");
  } else {
    modifiers.push("Use moderate sentence length. Balance brevity with depth.");
  }

  // Metaphor usage modifiers
  if (config.metaphorUsage > 0.7) {
    modifiers.push("Use rich metaphors and analogies. Paint vivid pictures.");
  } else if (config.metaphorUsage < 0.3) {
    modifiers.push("Minimize metaphor. Use direct, literal language.");
  } else {
    modifiers.push("Use metaphors sparingly, when they illuminate.");
  }

  // Example frequency modifiers
  if (config.exampleFrequency > 0.7) {
    modifiers.push("Include multiple concrete examples. Ground ideas in specifics.");
  } else if (config.exampleFrequency < 0.3) {
    modifiers.push("Minimize examples. Focus on principles and theory.");
  } else {
    modifiers.push("Include relevant examples where helpful.");
  }

  return modifiers.join("\n");
}

/**
 * Sentence structure variations
 */
const sentenceStarters = {
  direct: [
    "The core issue is",
    "Fundamentally,",
    "At its heart,",
    "The truth is",
    "Simply put,",
  ],
  questioning: [
    "What if",
    "Consider this:",
    "Have you thought about",
    "Here's a question:",
    "What emerges when",
  ],
  reflective: [
    "I notice",
    "It seems",
    "There's something here",
    "What strikes me",
    "Interestingly,",
  ],
  provocative: [
    "Here's the hard truth:",
    "Let me be direct:",
    "This might challenge you:",
    "Brace yourself:",
    "This is uncomfortable:",
  ],
  connective: [
    "Building on that,",
    "This connects to",
    "And here's where it gets interesting:",
    "This relates to",
    "The implication is",
  ],
};

/**
 * Get random sentence starter based on config
 */
export function getRandomSentenceStarter(config: VariabilityConfig): string {
  let category: keyof typeof sentenceStarters;

  if (config.formality > 0.7) {
    category = "direct";
  } else if (config.formality < 0.3) {
    category = "reflective";
  } else if (Math.random() > 0.5) {
    category = "questioning";
  } else {
    category = Math.random() > 0.5 ? "connective" : "provocative";
  }

  const starters = sentenceStarters[category];
  return starters[Math.floor(Math.random() * starters.length)];
}

/**
 * Vocabulary variations
 */
const vocabularyVariations: Record<string, string[]> = {
  "important": ["crucial", "significant", "key", "vital", "essential", "noteworthy"],
  "interesting": ["fascinating", "compelling", "intriguing", "remarkable", "striking"],
  "difficult": ["challenging", "complex", "intricate", "demanding", "arduous"],
  "clear": ["evident", "obvious", "apparent", "transparent", "manifest"],
  "think": ["consider", "contemplate", "ponder", "reflect", "reason"],
  "understand": ["grasp", "comprehend", "perceive", "discern", "fathom"],
  "change": ["transform", "shift", "evolve", "metamorphose", "transition"],
  "growth": ["development", "expansion", "evolution", "advancement", "flourishing"],
};

/**
 * Get vocabulary variation
 */
export function getVocabularyVariation(word: string): string {
  const variations = vocabularyVariations[word.toLowerCase()];
  if (!variations) {
    return word;
  }
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Transition phrase variations
 */
const transitionPhrases = {
  addition: [
    "Furthermore,",
    "Moreover,",
    "Additionally,",
    "Also,",
    "Beyond that,",
    "In addition,",
  ],
  contrast: [
    "However,",
    "Yet,",
    "But,",
    "Conversely,",
    "On the other hand,",
    "Interestingly,",
  ],
  causation: [
    "Because of this,",
    "As a result,",
    "Consequently,",
    "Therefore,",
    "This leads to,",
    "The implication is,",
  ],
  emphasis: [
    "Importantly,",
    "Crucially,",
    "Significantly,",
    "Most tellingly,",
    "What's striking is,",
    "The key point is,",
  ],
  exploration: [
    "Let's explore this:",
    "Consider:",
    "Think about:",
    "Here's what emerges:",
    "What if we examine:",
    "The deeper question is:",
  ],
};

/**
 * Get random transition phrase
 */
export function getRandomTransitionPhrase(type: keyof typeof transitionPhrases): string {
  const phrases = transitionPhrases[type];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Closing variations
 */
const closingPatterns = {
  openEnded: [
    "What emerges for you?",
    "Where does this lead?",
    "What's your insight?",
    "How does this land?",
    "What questions arise?",
  ],
  actionOriented: [
    "What's your next step?",
    "How will you apply this?",
    "What action calls to you?",
    "Where do you go from here?",
    "What will you do with this?",
  ],
  reflective: [
    "Sit with that.",
    "Let that settle.",
    "Notice what arises.",
    "Feel into that.",
    "Observe what emerges.",
  ],
  provocative: [
    "That's the real question.",
    "Now we're getting somewhere.",
    "This is where it gets interesting.",
    "That's the edge.",
    "That's where transformation lives.",
  ],
  grounded: [
    "That's the foundation.",
    "That's the core.",
    "That's the truth.",
    "That's what's real.",
    "That's where we stand.",
  ],
};

/**
 * Get random closing pattern
 */
export function getRandomClosingPattern(config: VariabilityConfig): string {
  let category: keyof typeof closingPatterns;

  if (config.brevity > 0.7) {
    category = "reflective";
  } else if (config.formality > 0.7) {
    category = "grounded";
  } else if (Math.random() > 0.5) {
    category = "openEnded";
  } else {
    category = Math.random() > 0.5 ? "actionOriented" : "provocative";
  }

  const patterns = closingPatterns[category];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * Apply variability to system prompt
 */
export function applyVariabilityToPrompt(basePrompt: string, config: VariabilityConfig): string {
  let prompt = basePrompt;

  // Add variability modifiers
  const modifiers = getVariabilityModifiers(config);
  prompt += "\n\nVariability Instructions:\n" + modifiers;

  // Add entropy instruction
  prompt += `\n\nConversation Entropy: ${(config.entropy * 100).toFixed(0)}%\n`;
  prompt += "Vary your sentence structure, vocabulary, and pacing to feel natural and human. ";
  prompt += "Avoid repetitive patterns. Each response should feel fresh.";

  return prompt;
}

/**
 * Generate response structure template based on config
 */
export function generateResponseStructureTemplate(config: VariabilityConfig): string {
  const structures = [
    // Structure 1: Direct -> Exploration -> Closing
    `${getRandomSentenceStarter(config)} [MAIN_IDEA]
${getRandomTransitionPhrase("exploration")} [EXPLORATION]
${getRandomClosingPattern(config)}`,

    // Structure 2: Question -> Analysis -> Implication
    `${getRandomSentenceStarter(config)} [QUESTION]
${getRandomTransitionPhrase("causation")} [ANALYSIS]
${getRandomTransitionPhrase("emphasis")} [IMPLICATION]
${getRandomClosingPattern(config)}`,

    // Structure 3: Observation -> Contrast -> Resolution
    `${getRandomSentenceStarter(config)} [OBSERVATION]
${getRandomTransitionPhrase("contrast")} [CONTRAST]
${getRandomTransitionPhrase("addition")} [RESOLUTION]
${getRandomClosingPattern(config)}`,

    // Structure 4: Simple -> Complex -> Integration
    `${getRandomSentenceStarter(config)} [SIMPLE]
${getRandomTransitionPhrase("addition")} [COMPLEXITY]
${getRandomTransitionPhrase("emphasis")} [INTEGRATION]`,
  ];

  return structures[Math.floor(Math.random() * structures.length)];
}
