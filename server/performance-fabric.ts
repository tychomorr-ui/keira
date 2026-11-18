export type PerformanceMetric = "TOTAL_REQUEST" | "XORIA" | "HYDRA_RETRIEVAL" | "MODEL_INFERENCE" | "SEMANTIC_EVALUATION" | "TRUTH_VALIDATION" | "RESPONSE_DELIVERY";

export type PerformanceSample = { metric: PerformanceMetric; durationMs: number; startedAt: string; completed: boolean };
export type PerformanceSnapshot = { sampleCount: number; p50: Record<PerformanceMetric, number | null>; p95: Record<PerformanceMetric, number | null>; p99: Record<PerformanceMetric, number | null>; hardware: { cpu: "UNAVAILABLE"; memory: "UNAVAILABLE"; gpu: "UNAVAILABLE" }; collectedAt: string };

const metrics: PerformanceMetric[] = ["TOTAL_REQUEST", "XORIA", "HYDRA_RETRIEVAL", "MODEL_INFERENCE", "SEMANTIC_EVALUATION", "TRUTH_VALIDATION", "RESPONSE_DELIVERY"];
const samples: PerformanceSample[] = [];

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? null;
}

export function beginPerformanceSpan(metric: PerformanceMetric): { finish(completed?: boolean): PerformanceSample } {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  let finished = false;
  return { finish(completed = true) { if (finished) return { metric, durationMs: 0, startedAt, completed }; finished = true; const sample = { metric, durationMs: Math.max(0, Date.now() - started), startedAt, completed }; samples.push(sample); return sample; } };
}

export function recordPerformanceSample(sample: PerformanceSample): void { samples.push({ ...sample, durationMs: Math.max(0, sample.durationMs) }); }
export function resetPerformanceSamples(): void { samples.length = 0; }
export function getPerformanceSnapshot(): PerformanceSnapshot {
  const p50 = {} as Record<PerformanceMetric, number | null>; const p95 = {} as Record<PerformanceMetric, number | null>; const p99 = {} as Record<PerformanceMetric, number | null>;
  for (const metric of metrics) { const values = samples.filter((sample) => sample.metric === metric).map((sample) => sample.durationMs); p50[metric] = percentile(values, 50); p95[metric] = percentile(values, 95); p99[metric] = percentile(values, 99); }
  return { sampleCount: samples.length, p50, p95, p99, hardware: { cpu: "UNAVAILABLE", memory: "UNAVAILABLE", gpu: "UNAVAILABLE" }, collectedAt: new Date().toISOString() };
}
