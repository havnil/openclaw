import { describe, it, expect } from "vitest";
import {
  buildHaPrependContext,
  HA_MEMORY_GUIDANCE,
  HA_PERSONA,
  shouldInjectHaGuidance,
} from "./memory-guidance.js";

describe("shouldInjectHaGuidance", () => {
  it("injects for homeassistant runs", () => {
    expect(shouldInjectHaGuidance({ messageProvider: "homeassistant" })).toBe(true);
  });
  it("does not inject for other channels", () => {
    expect(shouldInjectHaGuidance({ messageProvider: "whatsapp" })).toBe(false);
    expect(shouldInjectHaGuidance({})).toBe(false);
  });
});

describe("HA_MEMORY_GUIDANCE", () => {
  it("mentions the remember tool and proactive suggestions", () => {
    expect(HA_MEMORY_GUIDANCE).toContain("remember");
    expect(HA_MEMORY_GUIDANCE.toLowerCase()).toContain("suggest");
  });
});

describe("HA_PERSONA", () => {
  it("carries the household location and family facts", () => {
    expect(HA_PERSONA).toContain("Nordstrand");
    expect(HA_PERSONA).toContain("Nora");
    expect(HA_PERSONA).toContain("Matheo");
  });
});

describe("buildHaPrependContext", () => {
  it("returns undefined for non-HA runs", () => {
    expect(
      buildHaPrependContext({ messageProvider: "whatsapp", agentId: "home-x" }),
    ).toBeUndefined();
  });
  it("gives home-* agents the persona plus memory guidance", () => {
    const ctx = buildHaPrependContext({ messageProvider: "homeassistant", agentId: "home-abc" });
    expect(ctx).toContain(HA_PERSONA);
    expect(ctx).toContain(HA_MEMORY_GUIDANCE);
  });
  it("gives the owner's main agent memory guidance only (no household persona)", () => {
    const ctx = buildHaPrependContext({ messageProvider: "homeassistant", agentId: "main" });
    expect(ctx).toContain(HA_MEMORY_GUIDANCE);
    expect(ctx).not.toContain(HA_PERSONA);
  });
});
