const ESOTERIC_TERMS = [
  "akashic",
  "alchemy",
  "anima",
  "animus",
  "archetype",
  "astral",
  "awakening",
  "consciousness",
  "cosmology",
  "daemon",
  "dreamwork",
  "egregore",
  "entheogen",
  "gnosis",
  "hermetic",
  "liminal",
  "mandala",
  "metaphysics",
  "mysticism",
  "mythopoesis",
  "non-duality",
  "numinous",
  "occult",
  "ontology",
  "oracle",
  "paradigm",
  "quantum",
  "reincarnation",
  "ritual",
  "shamanic",
  "shadow work",
  "sigil",
  "simulation",
  "soul",
  "spirit",
  "synchronicity",
  "theurgy",
  "transcendence",
  "tulpa",
  "unconscious",
  "void",
  "gnostic",
  "esoteric",
  "etheric",
  "telepathy",
  "teleology",
  "panpsychism",
  "collective unconscious",
  "sacred geometry",
  "third eye",
  "dark night of the soul",
] as const;

const STOP_WORDS = new Set([
  "about", "after", "again", "being", "could", "every", "first", "from", "have", "into", "their", "there", "these", "thing", "those", "through", "under", "where", "which", "while", "would", "your",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const DISPLAY_PATTERN = new RegExp(
  `\\b(${[...ESOTERIC_TERMS].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|")})\\b`,
  "gi",
);

export type KeywordSegment = {
  text: string;
  keyword: string | null;
};

export function segmentEsotericText(text: string): KeywordSegment[] {
  const segments: KeywordSegment[] = [];
  let cursor = 0;
  for (const match of Array.from(text.matchAll(DISPLAY_PATTERN))) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: text.slice(cursor, index), keyword: null });
    const matched = match[0] ?? "";
    segments.push({ text: matched, keyword: matched.toLowerCase() });
    cursor = index + matched.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), keyword: null });
  return segments.length ? segments : [{ text, keyword: null }];
}

export function extractEsotericKeywords(text: string): string[] {
  const found = new Set<string>();
  for (const segment of segmentEsotericText(text)) {
    if (segment.keyword) found.add(segment.keyword);
  }

  const candidateWords = text.toLowerCase().match(/[a-z][a-z'-]{8,}/g) ?? [];
  for (const word of candidateWords) {
    if (!STOP_WORDS.has(word) && /(?:ism|ity|ology|mancy|pathy|genic|verse|sophy|tion)$/.test(word)) {
      found.add(word);
    }
  }

  return Array.from(found).slice(0, 24);
}

export function getEsotericLexicon() {
  return [...ESOTERIC_TERMS];
}
