import { createHash } from "node:crypto";
import { ingestTextDocument } from "../client/src/lib/corpus/ingest";
import type { CorpusEmbedding, CorpusIngestResult } from "../client/src/lib/corpus/types";
import { getDb } from "./db";
import { keiraCorpusVectors } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { generateEmbedding } from "./local-embedding-provider";
import { runHydraSearch } from "./hydra-search";

const VECTOR_DIMENSION = 768;

/** Deterministic fallback retained for offline or unavailable Ollama runtimes. */
function localVector(text: string): number[] {
  const vector = new Array<number>(VECTOR_DIMENSION).fill(0);
  const normalized = text.normalize("NFKC").toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    const digest = createHash("sha256").update(`${index}:${normalized[index]}`).digest();
    const slot = digest.readUInt32BE(0) % VECTOR_DIMENSION;
    vector[slot] += (digest[4] / 255) * 2 - 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return magnitude > 0 ? vector.map((value) => value / magnitude) : vector;
}

async function embedWithFallback(text: string): Promise<{ vector: number[]; runtime: "ollama" | "deterministic-fallback" }> {
  try {
    const vector = await generateEmbedding(text);
    return vector.length === VECTOR_DIMENSION
      ? { vector, runtime: "ollama" }
      : { vector: localVector(text), runtime: "deterministic-fallback" };
  } catch {
    return { vector: localVector(text), runtime: "deterministic-fallback" };
  }
}

export type IngestedCorpusDocument = CorpusIngestResult & {
  embeddings: CorpusEmbedding[];
  embedding: {
    model: "nomic-embed-text";
    modelVersion: "1.0";
    dimension: number;
    runtime: "ollama" | "deterministic-fallback";
  };
};

type StoredCorpus = IngestedCorpusDocument;
const corpusByUser = new Map<number, Map<string, StoredCorpus>>();

export async function ingestCorpusDocument(input: {
  filename: string;
  mimeType: "text/plain" | "text/markdown";
  content: string;
}, userId?: number): Promise<IngestedCorpusDocument> {
  const result = await ingestTextDocument({
    filename: input.filename,
    mimeType: input.mimeType,
    content: input.content,
    source: "operator-upload",
  });
  const embeddings: CorpusEmbedding[] = [];
  let embeddingRuntime: "ollama" | "deterministic-fallback" = "ollama";
  for (const chunk of result.chunks) {
    const embedded = await embedWithFallback(chunk.content);
    if (embedded.runtime === "deterministic-fallback") embeddingRuntime = embedded.runtime;
    embeddings.push({
      chunkCid: chunk.cid,
      model: "nomic-embed-text",
      modelVersion: "1.0",
      vector: embedded.vector,
      createdAt: chunk.createdAt,
      schemaVersion: "1.0.0",
    });
  }
  const stored: IngestedCorpusDocument = {
    ...result,
    embeddings,
    embedding: {
      model: "nomic-embed-text",
      modelVersion: "1.0",
      dimension: VECTOR_DIMENSION,
      runtime: embeddingRuntime,
    },
  };
  if (userId !== undefined) {
    const documents = corpusByUser.get(userId) ?? new Map<string, StoredCorpus>();
    documents.set(stored.document.id, stored);
    corpusByUser.set(userId, documents);
    const db = await getDb();
    if (db) {
      await db.delete(keiraCorpusVectors).where(and(eq(keiraCorpusVectors.userId, userId), eq(keiraCorpusVectors.documentId, stored.document.id)));
      await db.insert(keiraCorpusVectors).values(stored.chunks.map((chunk) => ({
        id: `${userId}:${chunk.cid}`,
        userId,
        documentId: stored.document.id,
        artifactCid: chunk.cid,
        filename: stored.document.metadata.filename,
        content: chunk.content,
        vectorJson: JSON.stringify(stored.embeddings.find((embedding) => embedding.chunkCid === chunk.cid)?.vector ?? []),
        embeddingModel: stored.embedding.model,
        embeddingVersion: stored.embedding.modelVersion,
        embeddingDimension: VECTOR_DIMENSION,
        embeddingRuntime: stored.embedding.runtime,
        contentSha256: createHash("sha256").update(chunk.content, "utf8").digest("hex"),
      })));
    }
  }
  return stored;
}

function cosine(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return -1;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator > 0 ? dot / denominator : -1;
}

export async function searchStoredCorpusEvidence(userId: number, query: string, limit = 8): Promise<Array<{ cid: string; snippet: string; score: number }>> {
  const records = Array.from(corpusByUser.get(userId)?.values() ?? []);
  const memoryRows = records.flatMap((record) => record.chunks.map((chunk) => {
    const embedding = record.embeddings.find((item) => item.chunkCid === chunk.cid);
    return embedding ? { artifactCid: chunk.cid, filename: record.document.metadata.filename, content: chunk.content, vectorJson: JSON.stringify(embedding.vector) } : null;
  })).filter((item): item is { artifactCid: string; filename: string; content: string; vectorJson: string } => item !== null);
  const db = await getDb();
  if (db) {
    const rows = await db.select({ artifactCid: keiraCorpusVectors.artifactCid, filename: keiraCorpusVectors.filename, content: keiraCorpusVectors.content, vectorJson: keiraCorpusVectors.vectorJson, embeddingDimension: keiraCorpusVectors.embeddingDimension, contentSha256: keiraCorpusVectors.contentSha256 })
      .from(keiraCorpusVectors).where(eq(keiraCorpusVectors.userId, userId));
    const validRows = rows.filter((row) => row.embeddingDimension === VECTOR_DIMENSION && createHash("sha256").update(row.content, "utf8").digest("hex") === row.contentSha256);
    if (validRows.length) {
      const hydra = await runHydraSearch(validRows, query, { limit: Math.max(1, Math.min(12, limit)) });
      const byId = new Map(validRows.map((row) => [row.artifactCid, row]));
      return hydra.fusion.map((entry) => ({ cid: entry.id, snippet: byId.get(entry.id)!.content, score: entry.score }));
    }
  }
  const hydra = await runHydraSearch(memoryRows, query, { limit: Math.max(1, Math.min(12, limit)) });
  const byId = new Map(memoryRows.map((row) => [row.artifactCid, row]));
  return hydra.fusion.map((entry) => ({ cid: entry.id, snippet: byId.get(entry.id)!.content, score: entry.score }));
}
