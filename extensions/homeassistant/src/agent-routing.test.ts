import { describe, it, expect } from "vitest";
import { resolveHaAgentId } from "./agent-routing.js";

describe("resolveHaAgentId", () => {
  it("routes admins to the unified main agent", () => {
    expect(resolveHaAgentId({ user_id: "abc", user_name: "A", is_admin: true })).toBe("main");
  });

  it("gives each non-admin their own home agent keyed by hass user id", () => {
    expect(
      resolveHaAgentId({
        user_id: "e1beb3678f434876953406295659a24b",
        user_name: "Nora",
        is_admin: false,
      }),
    ).toBe("home-e1beb3678f434876953406295659a24b");
  });

  it("falls back to a shared anonymous agent for a blank id", () => {
    expect(resolveHaAgentId({ user_id: "", user_name: "", is_admin: false })).toBe(
      "home-anonymous",
    );
  });
});
