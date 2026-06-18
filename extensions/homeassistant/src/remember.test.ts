import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { formatMemoryLine, appendMemoryLine, localDateStamp } from "./remember.js";

describe("formatMemoryLine", () => {
  it("formats a plain fact as a bullet", () => {
    expect(formatMemoryLine({ fact: "User is vegetarian" })).toBe("- User is vegetarian\n");
  });
  it("appends a category tag when given", () => {
    expect(formatMemoryLine({ fact: "Likes lo-fi playlists", category: "media" })).toBe(
      "- Likes lo-fi playlists _(media)_\n",
    );
  });
});

describe("localDateStamp", () => {
  it("formats YYYY-MM-DD in local time", () => {
    expect(localDateStamp(new Date(2026, 5, 18, 9, 30))).toBe("2026-06-18");
  });
});

describe("appendMemoryLine", () => {
  it("creates memory/<date>.md and appends, returning the trimmed line", async () => {
    const ws = await mkdtemp(join(tmpdir(), "ha-mem-"));
    const a = await appendMemoryLine({
      workspaceDir: ws,
      dateStamp: "2026-06-18",
      fact: "Has a dog named Rex",
    });
    const b = await appendMemoryLine({
      workspaceDir: ws,
      dateStamp: "2026-06-18",
      fact: "Comfort temp is 21C",
      category: "preference",
    });
    expect(a).toBe("- Has a dog named Rex");
    expect(b).toBe("- Comfort temp is 21C _(preference)_");
    const file = await readFile(join(ws, "memory", "2026-06-18.md"), "utf-8");
    expect(file).toBe("- Has a dog named Rex\n- Comfort temp is 21C _(preference)_\n");
  });
});
