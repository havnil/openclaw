import { describe, it, expect } from "vitest";
import { filterToolsForUser, RESTRICTED_TOOL_PATTERNS } from "./tool-filter.js";

describe("filterToolsForUser", () => {
  const allTools = [
    { name: "ha_get_states" },
    { name: "ha_call_service" },
    { name: "ha_get_history" },
    { name: "ha_fire_event" },
    { name: "file_read" },
    { name: "file_write" },
    { name: "file_edit" },
    { name: "shell_exec" },
    { name: "bash" },
    { name: "some_other_tool" },
  ];

  it("returns all tools for admin users", () => {
    const result = filterToolsForUser(allTools, true);
    expect(result).toEqual(allTools);
  });

  it("removes restricted tools for standard users", () => {
    const result = filterToolsForUser(allTools, false);
    const names = result.map((t) => t.name);
    expect(names).toContain("ha_get_states");
    expect(names).toContain("ha_call_service");
    expect(names).toContain("ha_get_history");
    expect(names).toContain("ha_fire_event");
    expect(names).toContain("some_other_tool");
    expect(names).not.toContain("file_read");
    expect(names).not.toContain("file_write");
    expect(names).not.toContain("file_edit");
    expect(names).not.toContain("shell_exec");
    expect(names).not.toContain("bash");
  });
});

describe("RESTRICTED_TOOL_PATTERNS", () => {
  it("includes file and shell patterns", () => {
    expect(RESTRICTED_TOOL_PATTERNS.length).toBeGreaterThan(0);
  });
});
