import { describe, it, expect } from "vitest";
import { HA_MEMORY_GUIDANCE, shouldInjectHaGuidance } from "./memory-guidance.js";

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
