import { describe, expect, it } from "vitest";
import {
  getCarryoverMessageLimit,
  getResponseObjectiveContract,
  resolveContextCarryover,
  resolveResponseObjective,
} from "./keira-response-controls";

describe("KEIRA response controls", () => {
  it("uses only the declared response objectives and falls back safely", () => {
    expect(resolveResponseObjective("analysis")).toBe("analysis");
    expect(resolveResponseObjective("unknown")).toBe("direct");
    expect(getResponseObjectiveContract("plan")).toContain("executable sequence");
  });

  it("enforces exact, inspectable carryover limits", () => {
    expect(resolveContextCarryover("minimal")).toBe("minimal");
    expect(resolveContextCarryover("invalid")).toBe("standard");
    expect(getCarryoverMessageLimit("minimal")).toBe(2);
    expect(getCarryoverMessageLimit("standard")).toBe(6);
    expect(getCarryoverMessageLimit("extended")).toBe(12);
  });
});
