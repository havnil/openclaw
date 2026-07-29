import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ConversationStore } from "./conversations.js";

describe("ConversationStore", () => {
  let store: ConversationStore;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ha-conv-test-"));
    store = new ConversationStore(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates a new conversation", async () => {
    const conv = await store.create("havnil");
    expect(conv.id).toBeTruthy();
    expect(conv.user_id).toBe("havnil");
    expect(conv.title).toBe("New conversation");
    expect(conv.messages).toEqual([]);
  });

  it("lists conversations for a user", async () => {
    await store.create("havnil");
    await store.create("havnil");
    await store.create("wife");

    const havnilConvs = await store.list("havnil");
    expect(havnilConvs).toHaveLength(2);

    const wifeConvs = await store.list("wife");
    expect(wifeConvs).toHaveLength(1);
  });

  it("lists conversations sorted by updated_at descending", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const c1 = await store.create("havnil");
    vi.advanceTimersByTime(1000);
    const c2 = await store.create("havnil");
    vi.advanceTimersByTime(1000);
    await store.appendMessage(c2.id, "havnil", {
      role: "user",
      text: "hello",
      timestamp: new Date().toISOString(),
    });
    vi.useRealTimers();

    const list = await store.list("havnil");
    expect(list[0].id).toBe(c2.id);
    expect(list[1].id).toBe(c1.id);
  });

  it("loads a conversation with messages", async () => {
    const conv = await store.create("havnil");
    await store.appendMessage(conv.id, "havnil", {
      role: "user",
      text: "turn on lights",
      timestamp: new Date().toISOString(),
    });
    await store.appendMessage(conv.id, "havnil", {
      role: "assistant",
      text: "Done!",
      timestamp: new Date().toISOString(),
    });

    const loaded = await store.load(conv.id, "havnil");
    expect(loaded).not.toBeNull();
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[0].text).toBe("turn on lights");
    expect(loaded!.messages[1].text).toBe("Done!");
  });

  it("returns null when loading another user's conversation", async () => {
    const conv = await store.create("havnil");
    const loaded = await store.load(conv.id, "wife");
    expect(loaded).toBeNull();
  });

  it("deletes a conversation", async () => {
    const conv = await store.create("havnil");
    await store.delete(conv.id, "havnil");
    const list = await store.list("havnil");
    expect(list).toHaveLength(0);
  });

  it("renames a conversation", async () => {
    const conv = await store.create("havnil");
    await store.rename(conv.id, "havnil", "Kitchen lights");
    const loaded = await store.load(conv.id, "havnil");
    expect(loaded!.title).toBe("Kitchen lights");
  });

  it("refuses to delete another user's conversation", async () => {
    const conv = await store.create("havnil");
    await store.delete(conv.id, "wife");
    const list = await store.list("havnil");
    expect(list).toHaveLength(1);
  });

  it("serializes concurrent appendMessage calls without losing messages or corrupting the file", async () => {
    const conv = await store.create("havnil");
    const N = 20;
    const writes = Array.from({ length: N }, (_, i) =>
      store.appendMessage(conv.id, "havnil", {
        role: i % 2 === 0 ? "user" : "assistant",
        text: `msg-${i}`,
        timestamp: new Date().toISOString(),
      }),
    );
    await Promise.all(writes);

    const loaded = await store.load(conv.id, "havnil");
    expect(loaded).not.toBeNull();
    expect(loaded!.messages).toHaveLength(N);
    const texts = new Set(loaded!.messages.map((m) => m.text));
    for (let i = 0; i < N; i++) {
      expect(texts.has(`msg-${i}`)).toBe(true);
    }
  });
});
