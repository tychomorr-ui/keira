import { generateEmbedding } from "./local-embedding-provider";
import { cosineSimilarity } from "./corpus-similarity";

export type HydraCorpusRow = {
  artifactCid: string;
  filename: string;
  content: string;
  vectorJson: string;
  contentSha256?: string | null;
};

export type HydraHead = "dense" | "keyword" | "rewrite" | "metadata";

export type HydraRank = {
  id: string;
  score: number;
  rank: number;
  head: HydraHead;
};

export type HydraSearchResult = {
  heads: Record<HydraHead, HydraRank[]>;
  fusion: Array<{ id: string; score: number; ranks: Partial<Record<HydraHead, number>> }>;
  rewriteQueries: string[];
};

const RRF_K = 60;

function tokens(value: string): string[] {
  return value.toLowerCase().normalize("NFKC").match(/[a-z0-9_]+/g) ?? [];
}

function parseVector(value: string): number[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => Number.isFinite(Number(item)))
      ? parsed.map(Number)
      : [];
  } catch {
    return [];
  }
}

function rankByScore(entries: Array<{ id: string; score: number }>, head: HydraHead, limit: number): HydraRank[] {
  return entries
    .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1, head }));
}

/**
 * Deterministic query rewrites. This is deliberately lexical rather than
 * generative: the rewrite head cannot invent corpus terms or external facts.
 */
export function buildHydraRewriteQueries(query: string): string[] {
  const normalized = query.normalize("NFKC").replace(/\s+/g, " ").trim();
  const withoutQuestionLead = normalized.replace(/^(what|who|where|when|why|how|can|does|is|are)\s+(is|are|does|do|the|a|an)?\s*/i, "").trim();
  const keywordQuery = tokens(normalized).filter((token) => token.length > 2).join(" ");
  return Array.from(new Set([normalized, withoutQuestionLead, keywordQuery].filter(Boolean))).slice(0, 3);
}

export async function runHydraSearch(
  rows: HydraCorpusRow[],
  query: string,
  options: { limit?: number; denseLimit?: number } = {},
): Promise<HydraSearchResult> {
  const limit = Math.max(1, Math.min(30, Math.floor(options.limit ?? 30)));
  const denseLimit = Math.max(limit, Math.min(rows.length, Math.floor(options.denseLimit ?? 60)));
  const queryTokens = tokens(query);
  const heads: Record<HydraHead, HydraRank[]> = {
    dense: [],
    keyword: [],
    rewrite: [],
    metadata: [],
  };

  heads.keyword = rankByScore(rows.map((row) => {
    const rowTokens = new Set(tokens(row.content));
    const overlap = queryTokens.filter((token) => rowTokens.has(token)).length;
    const phraseBonus = queryTokens.length > 1 && row.content.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
    return { id: row.artifactCid, score: queryTokens.length ? overlap / queryTokens.length + phraseBonus : 0 };
  }), "keyword", denseLimit);

  heads.metadata = rankByScore(rows.map((row) => {
    const filenameTokens = new Set(tokens(row.filename));
    return { id: row.artifactCid, score: queryTokens.filter((token) => filenameTokens.has(token)).length };
  }), "metadata", denseLimit);

  const rowById = new Map(rows.map((row) => [row.artifactCid, row]));
  try {
    const queryEmbedding = await generateEmbedding(query);
    heads.dense = rankByScore(rows.map((row) => ({
      id: row.artifactCid,
      score: cosineSimilarity(queryEmbedding, parseVector(row.vectorJson)),
    })), "dense", denseLimit);
  } catch {
    heads.dense = [];
  }

  const rewriteQueries = buildHydraRewriteQueries(query);
  const rewriteScores = new Map<string, number>();
  for (const rewrite of rewriteQueries) {
    const rewriteTerms = new Set(tokens(rewrite));
    for (const row of rows) {
      const rowTerms = new Set(tokens(row.content));
      const overlap = Array.from(rewriteTerms).filter((term) => rowTerms.has(term)).length;
      if (overlap) rewriteScores.set(row.artifactCid, (rewriteScores.get(row.artifactCid) ?? 0) + overlap / Math.max(1, rewriteTerms.size));
    }
  }
  heads.rewrite = rankByScore(Array.from(rewriteScores, ([id, score]) => ({ id, score })), "rewrite", denseLimit);

  const rankMap = new Map<string, Partial<Record<HydraHead, number>>>();
  const fusedScores = new Map<string, number>();
  for (const [head, entries] of Object.entries(heads) as Array<[HydraHead, HydraRank[]]>) {
    for (const entry of entries) {
      const ranks = rankMap.get(entry.id) ?? {};
      ranks[head] = entry.rank;
      rankMap.set(entry.id, ranks);
      fusedScores.set(entry.id, (fusedScores.get(entry.id) ?? 0) + 1 / (RRF_K + entry.rank));
    }
  }
  const fusion = Array.from(fusedScores, ([id, score]) => ({ id, score, ranks: rankMap.get(id) ?? {} }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit)
    .filter((entry) => rowById.has(entry.id));

  return { heads, fusion, rewriteQueries };
}

export const HYDRA_RRF_CONSTANT = RRF_K;

export function hydraQueryTerms(query: string): Set<string> {
  return new Set(tokens(query));
}
