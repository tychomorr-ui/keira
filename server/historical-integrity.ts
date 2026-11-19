import { createHash } from "node:crypto";

export type IntegrityState = "CRYPTOGRAPHIC_VERIFIED" | "LEGACY_LEXICAL" | "UNVERIFIED" | "INTEGRITY_FAILED";
export type HistoricalArtifact = { artifactId: string; content: string; preservedHash?: string | null; sourceIdentity?: string | null; provenance?: string[] };
export type IntegrityAssessment = { artifactId: string; state: IntegrityState; computedHash: string | null; preservedHash: string | null; sourceIdentity: string | null; provenance: string[]; reason: string };

export function assessHistoricalIntegrity(artifact: HistoricalArtifact): IntegrityAssessment {
  const preservedHash = artifact.preservedHash?.trim().toLowerCase() || null;
  const provenance = [...(artifact.provenance ?? []), "historical-integrity-assessment"];
  if (!preservedHash) return { artifactId: artifact.artifactId, state: "LEGACY_LEXICAL", computedHash: null, preservedHash: null, sourceIdentity: artifact.sourceIdentity ?? null, provenance, reason: "No trustworthy preserved hash is available; cryptographic verification was not claimed." };
  const computedHash = createHash("sha256").update(artifact.content, "utf8").digest("hex");
  if (!/^[a-f0-9]{64}$/.test(preservedHash)) return { artifactId: artifact.artifactId, state: "UNVERIFIED", computedHash, preservedHash, sourceIdentity: artifact.sourceIdentity ?? null, provenance, reason: "Preserved hash metadata is malformed; verification was not claimed." };
  if (computedHash !== preservedHash) return { artifactId: artifact.artifactId, state: "INTEGRITY_FAILED", computedHash, preservedHash, sourceIdentity: artifact.sourceIdentity ?? null, provenance, reason: "Recomputed content hash does not match the preserved historical hash." };
  return { artifactId: artifact.artifactId, state: "CRYPTOGRAPHIC_VERIFIED", computedHash, preservedHash, sourceIdentity: artifact.sourceIdentity ?? null, provenance, reason: "Recomputed content hash matches the preserved historical hash." };
}
