import { EventEmitter } from "node:events";
import type { IncomingMessage } from "node:http";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ConversationSummary, StoredMessage } from "./protocol.js";
import { handleHaWebSocket } from "./ws-handler.js";
import type { HaWsHandlerDeps } from "./ws-handler.js";

// ── Fake WebSocket ───────────────────────────────────────────────────────────

class FakeWs extends EventEmitter {
  OPEN = 1 as const;
  readyState = 1;
  sent: Record<string, unknown>[] = [];
  closed: { code?: number; reason?: string } | null = null;

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close(code?: number, reason?: string) {
    this.closed = { code, reason };
  }

  ping() {}

  /** Simulate client sending a JSON message */
  clientSend(msg: unknown) {
    this.emit("message", Buffer.from(JSON.stringify(msg)));
  }
}

function fakeReq(query: string): IncomingMessage {
  return { url: `/homeassistant/ws${query}` } as IncomingMessage;
}

// ── Deps factory ─────────────────────────────────────────────────────────────

function makeDeps(overrides?: Partial<HaWsHandlerDeps>): HaWsHandlerDeps {
  return {
    configSecret: "test-secret",
    admins: ["havnil"],
    conversationStore: {
      list: vi.fn<(userId: string) => Promise<ConversationSummary[]>>().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "conv-1", title: "New conversation" }),
      load: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
      appendMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as HaWsHandlerDeps["conversationStore"],
    dispatchMessage: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("handleHaWebSocket", () => {
  let ws: FakeWs;
  let timers: ReturnType<typeof vi.useFakeTimers> | null = null;

  beforeEach(() => {
    ws = new FakeWs();
  });

  afterEach(() => {
    if (timers) {
      vi.useRealTimers();
      timers = null;
    }
  });

  // ── Auth ─────────────────────────────────────────────────────────────────

  it("closes with error on invalid secret", () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=wrong&user_id=x"),
      deps,
    );
    expect(ws.sent).toEqual([{ type: "error", message: "Invalid secret" }]);
    expect(ws.closed).toEqual({ code: 4001, reason: "Invalid secret" });
  });

  it("closes with error on missing user_id", () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret"),
      deps,
    );
    expect(ws.sent).toEqual([{ type: "error", message: "Missing user_id" }]);
    expect(ws.closed).toEqual({ code: 4001, reason: "Missing user_id" });
  });

  it("accepts valid handshake and stays open", () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil&user_name=Havnil"),
      deps,
    );
    expect(ws.sent).toEqual([]);
    expect(ws.closed).toBeNull();
  });

  // ── Conversations ────────────────────────────────────────────────────────

  it("handles list_conversations", async () => {
    const convs: ConversationSummary[] = [
      { id: "c1", title: "Test", created_at: "2026-01-01", updated_at: "2026-01-01" },
    ];
    const deps = makeDeps();
    vi.mocked(deps.conversationStore.list).mockResolvedValue(convs);

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "list_conversations" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({
      type: "conversations_list",
      conversations: [{ id: "c1", title: "Test", updated_at: "2026-01-01" }],
    });
    expect(deps.conversationStore.list).toHaveBeenCalledWith("havnil");
  });

  it("handles new_conversation", async () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "new_conversation" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({
      type: "conversation_created",
      id: "conv-1",
      title: "New conversation",
    });
  });

  it("handles load_conversation (found)", async () => {
    const msgs: StoredMessage[] = [{ role: "user", text: "hi", timestamp: "2026-01-01T00:00:00Z" }];
    const deps = makeDeps();
    vi.mocked(deps.conversationStore.load).mockResolvedValue({
      id: "c1",
      user_id: "havnil",
      title: "Loaded",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      messages: msgs,
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "load_conversation", conversation_id: "c1" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({
      type: "conversation_history",
      conversation_id: "c1",
      title: "Loaded",
      messages: [
        {
          id: "2026-01-01T00:00:00Z",
          role: "user",
          content: "hi",
          ts: "2026-01-01T00:00:00Z",
          attachments: undefined,
          tool_call: undefined,
        },
      ],
    });
  });

  it("handles load_conversation (not found)", async () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "load_conversation", conversation_id: "missing" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({ type: "error", message: "Conversation not found" });
  });

  it("handles delete_conversation", async () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "delete_conversation", conversation_id: "c1" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({ type: "conversation_deleted", id: "c1" });
    expect(deps.conversationStore.delete).toHaveBeenCalledWith("c1", "havnil");
  });

  it("handles rename_conversation", async () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "rename_conversation", conversation_id: "c1", title: "Renamed" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({ type: "conversation_renamed", id: "c1", title: "Renamed" });
    expect(deps.conversationStore.rename).toHaveBeenCalledWith("c1", "havnil", "Renamed");
  });

  // ── Chat messages ────────────────────────────────────────────────────────

  it("auto-creates conversation and streams AI response on message", async () => {
    const deps = makeDeps({
      dispatchMessage: vi.fn(async ({ onToken, onDone }) => {
        onToken("Hello");
        onToken(" world");
        onDone("Hello world");
      }),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "message", text: "hi" });
    // Wait for auto-title rename (happens after appendMessage + rename)
    await vi.waitFor(() =>
      expect(vi.mocked(deps.conversationStore.rename)).toHaveBeenCalledTimes(1),
    );

    expect(ws.sent).toEqual([
      { type: "conversation_created", id: "conv-1", title: "New conversation" },
      { type: "stream_token", stream_id: undefined, token: "Hello" },
      { type: "stream_token", stream_id: undefined, token: " world" },
      { type: "stream_done", stream_id: undefined, full_text: "Hello world" },
      { type: "conversation_renamed", id: "conv-1", title: "hi" },
    ]);
  });

  it("uses explicit conversation_id from client message", async () => {
    const deps = makeDeps({
      dispatchMessage: vi.fn(async ({ onDone }) => onDone("ok")),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );

    // First create a conversation so activeConversationId is set
    ws.clientSend({ type: "new_conversation" });
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    ws.clientSend({ type: "message", text: "hi", conversation_id: "explicit-id" });
    await vi.waitFor(() => ws.sent.some((m) => m.type === "done"));

    // User message should be appended to explicit-id, not conv-1
    const appendCalls = vi.mocked(deps.conversationStore.appendMessage).mock.calls;
    const userMsgCall = appendCalls.find((c) => (c[2] as StoredMessage).role === "user");
    expect(userMsgCall?.[0]).toBe("explicit-id");
  });

  it("sends tool_use and tool_result events during dispatch", async () => {
    const deps = makeDeps({
      dispatchMessage: vi.fn(async ({ onToolUse, onToolResult, onDone }) => {
        onToolUse("ha_get_states", { entity_id: "light.kitchen" });
        onToolResult("ha_get_states", '{"state":"on"}', false);
        onDone("The light is on.");
      }),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "message", text: "check kitchen" });
    await vi.waitFor(() =>
      expect(vi.mocked(deps.conversationStore.appendMessage)).toHaveBeenCalledTimes(2),
    );

    const types = ws.sent.map((m) => m.type);
    expect(types).toContain("tool_call");
    expect(types).toContain("stream_done");
  });

  it("sends error on dispatch failure", async () => {
    const deps = makeDeps({
      dispatchMessage: vi.fn().mockRejectedValue(new Error("AI broke")),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({ type: "message", text: "hi" });
    // Wait for the error to appear — dispatch rejects, catch block sends stream_error
    await vi.waitFor(() => {
      const errors = ws.sent.filter((m) => m.type === "stream_error");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatchObject({ type: "stream_error", error: "Error: AI broke" });
    });
  });

  // ── Upload ───────────────────────────────────────────────────────────────

  it("handles file upload", async () => {
    const deps = makeDeps({
      dispatchMessage: vi.fn(async ({ onDone }) => onDone("I see an image.")),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.clientSend({
      type: "upload",
      file_name: "photo.jpg",
      mime_type: "image/jpeg",
      data: "base64data",
    });
    await vi.waitFor(() =>
      expect(vi.mocked(deps.conversationStore.appendMessage)).toHaveBeenCalledTimes(2),
    );

    expect(ws.sent[0]).toEqual({
      type: "conversation_created",
      id: "conv-1",
      title: "New conversation",
    });
    expect(ws.sent).toContainEqual(
      expect.objectContaining({ type: "stream_done", full_text: "I see an image." }),
    );

    // Verify attachments passed to dispatch
    const dispatchCall = vi.mocked(deps.dispatchMessage).mock.calls[0]![0];
    expect(dispatchCall.attachments).toEqual([
      { file_name: "photo.jpg", mime_type: "image/jpeg", data: "base64data" },
    ]);
  });

  // ── Invalid JSON ─────────────────────────────────────────────────────────

  it("sends error on invalid JSON", async () => {
    const deps = makeDeps();
    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );
    ws.emit("message", Buffer.from("not json"));
    await vi.waitFor(() => expect(ws.sent).toHaveLength(1));

    expect(ws.sent[0]).toEqual({ type: "error", message: "Invalid JSON" });
  });

  // ── Stop generating ──────────────────────────────────────────────────────

  it("aborts active dispatch on stop_generating", async () => {
    let capturedSignal: AbortSignal | null = null;
    const deps = makeDeps({
      dispatchMessage: vi.fn(async ({ signal }) => {
        capturedSignal = signal;
        // Simulate slow work
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }),
    });

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );

    ws.clientSend({ type: "message", text: "long task" });
    // Wait for dispatch to start
    await vi.waitFor(() => expect(capturedSignal).not.toBeNull());

    ws.clientSend({ type: "stop_generating" });
    expect(capturedSignal!.aborted).toBe(true);
  });

  // ── Keepalive ────────────────────────────────────────────────────────────

  it("clears ping interval on close", () => {
    timers = vi.useFakeTimers();
    const pingSpy = vi.spyOn(ws, "ping");
    const deps = makeDeps();

    handleHaWebSocket(
      ws as unknown as import("ws").WebSocket,
      fakeReq("?secret=test-secret&user_id=havnil"),
      deps,
    );

    vi.advanceTimersByTime(30_000);
    expect(pingSpy).toHaveBeenCalledTimes(1);

    ws.emit("close");
    vi.advanceTimersByTime(60_000);
    // No more pings after close
    expect(pingSpy).toHaveBeenCalledTimes(1);
  });
});
