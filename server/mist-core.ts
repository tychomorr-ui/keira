import { getDb } from "./db";
import { keiraCorpusVectors } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { runHydraSearch, HYDRA_RRF_CONSTANT, type HydraCorpusRow } from "./hydra-search";
import { commitMistResult } from "./mist-commitment";

type MistArtifact = { cid: string; content: string; source: string; layer: number; score: number; contentSha256?: string | null };
export type MistResult = {
  query: string;
  artifacts: MistArtifact[];
  trajectory_root_cid: string;
  layer_memberships: Record<number, string[]>;
  hydra?: {
    rewriteQueries: string[];
    heads: Record<string, Array<{ id: string; score: number; rank: number }>>;
    rrfConstant: number;
  };
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function runMist(query: string, options: { maxArtifacts?: number; userId?: number } = {}): Promise<MistResult> {
  const maxArtifacts = Math.max(1, Math.min(30, Math.floor(options.maxArtifacts ?? 30)));
  const empty: MistResult = { query, artifacts: [], trajectory_root_cid: "", layer_memberships: {} };
  if (!query.trim() || !options.userId) return empty;
  const db = await getDb();
  if (!db) return empty;
  const rows = await db.select({ artifactCid: keiraCorpusVectors.artifactCid, filename: keiraCorpusVectors.filename, content: keiraCorpusVectors.content, vectorJson: keiraCorpusVectors.vectorJson, contentSha256: keiraCorpusVectors.contentSha256 })
    .from(keiraCorpusVectors)
    .where(eq(keiraCorpusVectors.userId, options.userId)) as HydraCorpusRow[];
  if (!rows.length) return empty;

  const hydra = await runHydraSearch(rows, query, { limit: maxArtifacts, denseLimit: Math.max(maxArtifacts, 30) });
  const layerLists: Record<number, string[]> = {
    1: hydra.heads.keyword.map((entry) => entry.id),
    2: hydra.heads.dense.map((entry) => entry.id),
    3: hydra.heads.rewrite.map((entry) => entry.id),
    4: hydra.heads.dense.slice(Math.floor(hydra.heads.dense.length / 2)).map((entry) => entry.id),
    5: hydra.fusion.filter((_, index) => index % 2 === 0).map((entry) => entry.id),
    6: hydra.heads.metadata.map((entry) => entry.id),
    7: hydra.fusion.map((entry) => entry.id),
  };
  const memberships = Object.fromEntries(Object.entries(layerLists).map(([layer, ids]) => [Number(layer), unique(ids)]));
  const rowById = new Map(rows.map((row) => [row.artifactCid, row]));
  const artifacts = hydra.fusion.map((entry) => {
    const row = rowById.get(entry.id)!;
    const layers = Object.entries(memberships).filter(([, ids]) => ids.includes(entry.id)).map(([layer]) => Number(layer));
    return { cid: entry.id, content: row.content, source: row.filename, layer: layers[0] ?? 7, score: entry.score, contentSha256: row.contentSha256 };
  });
  const resultWithoutRoot = {
    query,
    artifacts,
    layer_memberships: memberships,
    hydra: {
      rewriteQueries: hydra.rewriteQueries,
      heads: Object.fromEntries(Object.entries(hydra.heads).map(([head, entries]) => [head, entries.map(({ id, score, rank }) => ({ id, score, rank }))])),
      rrfConstant: HYDRA_RRF_CONSTANT,
    },
  };
  const trajectory_root_cid = commitMistResult({ ...resultWithoutRoot, trajectory_root_cid: "" }).merkle_root;
  return { ...resultWithoutRoot, trajectory_root_cid };
}
