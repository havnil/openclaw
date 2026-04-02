import { describe, it, expect } from "vitest";
import { verifyHandshake, isAdmin } from "./auth.js";

describe("verifyHandshake", () => {
  it("accepts valid secret and extracts user identity", () => {
    const result = verifyHandshake({
      secret: "test-secret",
      user_id: "havnil",
      user_name: "Havnil",
      configSecret: "test-secret",
      admins: ["havnil"],
    });
    expect(result).toEqual({
      ok: true,
      user: { user_id: "havnil", user_name: "Havnil", is_admin: true },
    });
  });

  it("rejects invalid secret", () => {
    const result = verifyHandshake({
      secret: "wrong-secret",
      user_id: "havnil",
      user_name: "Havnil",
      configSecret: "test-secret",
      admins: ["havnil"],
    });
    expect(result).toEqual({ ok: false, error: "Invalid secret" });
  });

  it("rejects missing secret", () => {
    const result = verifyHandshake({
      secret: undefined,
      user_id: "havnil",
      user_name: "Havnil",
      configSecret: "test-secret",
      admins: ["havnil"],
    });
    expect(result).toEqual({ ok: false, error: "Invalid secret" });
  });

  it("rejects missing user_id", () => {
    const result = verifyHandshake({
      secret: "test-secret",
      user_id: undefined,
      user_name: "Havnil",
      configSecret: "test-secret",
      admins: ["havnil"],
    });
    expect(result).toEqual({ ok: false, error: "Missing user_id" });
  });

  it("marks non-admin users correctly", () => {
    const result = verifyHandshake({
      secret: "test-secret",
      user_id: "wife",
      user_name: "Wife",
      configSecret: "test-secret",
      admins: ["havnil"],
    });
    expect(result).toEqual({
      ok: true,
      user: { user_id: "wife", user_name: "Wife", is_admin: false },
    });
  });
});

describe("isAdmin", () => {
  it("returns true for admin user", () => {
    expect(isAdmin("havnil", ["havnil", "other"])).toBe(true);
  });

  it("returns false for non-admin user", () => {
    expect(isAdmin("wife", ["havnil"])).toBe(false);
  });

  it("returns false for empty admins list", () => {
    expect(isAdmin("havnil", [])).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isAdmin("Havnil", ["havnil"])).toBe(false);
  });
});
