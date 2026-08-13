import { describe, expect, it } from "vitest";
import { createMissionState } from "./cmap-handshake";
import {
  buildcMAPContext,
  extractLivingContext,
  processcMAPMessage,
} from "./cmap-portal-integration";

describe("cMAP Portal integration", () => {
  it("derives a mission intent from the operator's first statement", () => {
    const state = createMissionState("session_test", "Awaiting Intent");
    const result = processcMAPMessage(
      "Ship the Portal refinement. Keep the interface focused.",
      state,
    );

    expect(result.missionState.missionIntent).toBe("Ship the Portal refinement");
    expect(result.missionState.missionStatus).toBe("active");
  });

  it("extracts only explicit living-context signals from a Portal response", () => {
    const state = createMissionState("session_test", "Ship the Portal refinement");
    const result = extractLivingContext(
      "Decision: keep Portal as the only active feature. Evidence: the existing cMAP contract is additive. What is the next action?",
      state,
    );

    expect(result.decisions).toEqual([
      "Decision: keep Portal as the only active feature",
    ]);
    expect(result.evidence).toEqual([
      "Evidence: the existing cMAP contract is additive",
    ]);
    expect(result.openQuestions).toEqual([
      "What is the next action?",
    ]);
  });

  it("formats available mission state without inventing telemetry", () => {
    const state = createMissionState("session_test", "Ship the Portal refinement");
    const context = buildcMAPContext(state);

    expect(context).toContain("Mission: Ship the Portal refinement");
    expect(context).toContain("Status: active");
    expect(context).toContain("Next Action: Continue mission execution");
    expect(context).not.toContain("latency");
    expect(context).not.toContain("uptime");
  });
});
