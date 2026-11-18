import { describe, expect, it } from "vitest";
import { beginPerformanceSpan, getPerformanceSnapshot, recordPerformanceSample, resetPerformanceSamples } from "./performance-fabric";

describe("Performance Fabric", () => {
  it("records actual span completion and reports percentiles", () => {
    resetPerformanceSamples();
    const span = beginPerformanceSpan("XORIA");
    const sample = span.finish();
    expect(sample.metric).toBe("XORIA");
    expect(sample.completed).toBe(true);
    expect(sample.durationMs).toBeGreaterThanOrEqual(0);
    const snapshot = getPerformanceSnapshot();
    expect(snapshot.sampleCount).toBe(1);
    expect(snapshot.p50.XORIA).toBe(sample.durationMs);
  });

  it("preserves incomplete samples and does not fabricate hardware data", () => {
    resetPerformanceSamples();
    recordPerformanceSample({ metric: "MODEL_INFERENCE", durationMs: 120, startedAt: new Date().toISOString(), completed: false });
    const snapshot = getPerformanceSnapshot();
    expect(snapshot.p95.MODEL_INFERENCE).toBe(120);
    expect(snapshot.hardware).toEqual({ cpu: "UNAVAILABLE", memory: "UNAVAILABLE", gpu: "UNAVAILABLE" });
  });
});
