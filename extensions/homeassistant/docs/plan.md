# Home Assistant Channel Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ChatGPT-style chat panel to Home Assistant's sidebar, powered by OpenClaw over WebSocket, with per-user permission tiers and full conversation persistence.

**Architecture:** The OpenClaw channel plugin (`extensions/homeassistant/`) registers a WebSocket route on the gateway for bidirectional streaming. An HA custom component (`custom_components/openclaw/`) provides a mobile-first LitElement chat panel in HA's sidebar. Conversations are persisted to disk per user. Admin users (explicit config list) get all tools; standard users get HA tools only.

**Tech Stack:** TypeScript (OpenClaw plugin), Python (HA integration), LitElement/JS (chat panel), Playwright (E2E tests), Vitest (unit tests), Web Speech API (voice input)

---

## File Structure

### OpenClaw Plugin (`extensions/homeassistant/`)

| File                        | Responsibility                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `index.ts`                  | Plugin entry — registers tools AND channel via `defineChannelPluginEntry`                                        |
| `src/channel.ts`            | Channel plugin definition — WebSocket route, auth, message dispatch                                              |
| `src/ws-handler.ts`         | WebSocket connection handler — handshake, message routing, streaming                                             |
| `src/auth.ts`               | Auth + permission logic — secret verification, admin check, tool filtering                                       |
| `src/conversations.ts`      | Conversation CRUD — create, load, list, delete, auto-title                                                       |
| `src/protocol.ts`           | WebSocket protocol types — all message type definitions                                                          |
| ~~`src/tool-filter.ts`~~    | REMOVED 2026-10-05 — dead code; per-user restriction = per-agent tool policy (`agents.entries.<id>.tools.allow`) |
| `openclaw.plugin.json`      | Updated manifest with channel + config schema                                                                    |
| `package.json`              | Updated with new deps                                                                                            |
| `src/channel.test.ts`       | Unit tests for channel registration                                                                              |
| `src/ws-handler.test.ts`    | Unit tests for WebSocket handler                                                                                 |
| `src/auth.test.ts`          | Unit tests for auth + permissions                                                                                |
| `src/conversations.test.ts` | Unit tests for conversation CRUD                                                                                 |
| `src/tool-filter.test.ts`   | Unit tests for tool filtering                                                                                    |

### HA Custom Component (`custom_components/openclaw/`)

| File                         | Responsibility                                |
| ---------------------------- | --------------------------------------------- |
| `__init__.py`                | HA integration setup — register panel         |
| `manifest.json`              | HA integration metadata                       |
| `config_flow.py`             | Config flow for setup UI                      |
| `const.py`                   | Constants — domain, defaults                  |
| `translations/en.json`       | UI strings for config flow                    |
| `frontend/openclaw-panel.js` | LitElement chat panel — full ChatGPT-style UI |
| `hacs.json`                  | HACS packaging metadata                       |

### Tests (`extensions/homeassistant/tests/`)

| File                       | Responsibility                                       |
| -------------------------- | ---------------------------------------------------- |
| `e2e/ha-panel.e2e.test.ts` | Playwright E2E — login, chat, streaming, permissions |

---

## Task 1: WebSocket Protocol Types

**Files:**

- Create: `extensions/homeassistant/src/protocol.ts`

- [ ] **Step 1: Define all protocol message types**

```typescript
// extensions/homeassistant/src/protocol.ts

// ── Client → Server ──────────────────────────────────────────────────────────

export type ClientMessage =
  | ClientChatMessage
  | ClientUploadMessage
  | ClientNewConversation
  | ClientLoadConversation
  | ClientDeleteConversation
  | ClientListConversations
  | ClientRenameConversation
  | ClientStopGenerating;

export interface ClientChatMessage {
  type: "message";
  text: string;
  conversation_id?: string;
}

export interface ClientUploadMessage {
  type: "upload";
  file_name: string;
  mime_type: string;
  data: string; // base64
  conversation_id?: string;
}

export interface ClientNewConversation {
  type: "new_conversation";
}

export interface ClientLoadConversation {
  type: "load_conversation";
  conversation_id: string;
}

export interface ClientDeleteConversation {
  type: "delete_conversation";
  conversation_id: string;
}

export interface ClientListConversations {
  type: "list_conversations";
}

export interface ClientRenameConversation {
  type: "rename_conversation";
  conversation_id: string;
  title: string;
}

export interface ClientStopGenerating {
  type: "stop_generating";
}

// ── Server → Client ──────────────────────────────────────────────────────────

export type ServerMessage =
  | ServerTokenMessage
  | ServerDoneMessage
  | ServerToolUseMessage
  | ServerToolResultMessage
  | ServerErrorMessage
  | ServerConversationsMessage
  | ServerConversationLoadedMessage
  | ServerConversationCreatedMessage
  | ServerConversationDeletedMessage
  | ServerConversationRenamedMessage
  | ServerPongMessage;

export interface ServerTokenMessage {
  type: "token";
  text: string;
}

export interface ServerDoneMessage {
  type: "done";
  full_text: string;
}

export interface ServerToolUseMessage {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

export interface ServerToolResultMessage {
  type: "tool_result";
  name: string;
  output: string;
  is_error?: boolean;
}

export interface ServerErrorMessage {
  type: "error";
  message: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ServerConversationsMessage {
  type: "conversations";
  list: ConversationSummary[];
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  tool_calls?: Array<{ name: string; input: Record<string, unknown>; output: string }>;
  attachments?: Array<{ file_name: string; mime_type: string }>;
}

export interface ServerConversationLoadedMessage {
  type: "conversation_loaded";
  id: string;
  title: string;
  messages: StoredMessage[];
}

export interface ServerConversationCreatedMessage {
  type: "conversation_created";
  id: string;
  title: string;
}

export interface ServerConversationDeletedMessage {
  type: "conversation_deleted";
  id: string;
}

export interface ServerConversationRenamedMessage {
  type: "conversation_renamed";
  id: string;
  title: string;
}

export interface ServerPongMessage {
  type: "pong";
}

// ── Shared ────────────────────────────────────────────────────────────────────

export interface HaUserIdentity {
  user_id: string;
  user_name: string;
  is_admin: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
scripts/committer "feat(homeassistant): add WebSocket protocol types" extensions/homeassistant/src/protocol.ts
```

---

## Task 2: Auth and Permission Module

**Files:**

- Create: `extensions/homeassistant/src/auth.ts`
- Create: `extensions/homeassistant/src/auth.test.ts`

- [ ] **Step 1: Write failing tests for auth**

```typescript
// extensions/homeassistant/src/auth.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- extensions/homeassistant/src/auth.test.ts -v`
Expected: FAIL — `auth.js` does not exist

- [ ] **Step 3: Implement auth module**

```typescript
// extensions/homeassistant/src/auth.ts
import type { HaUserIdentity } from "./protocol.js";

export interface HandshakeParams {
  secret: string | undefined;
  user_id: string | undefined;
  user_name: string | undefined;
  configSecret: string;
  admins: string[];
}

export type HandshakeResult = { ok: true; user: HaUserIdentity } | { ok: false; error: string };

export function isAdmin(userId: string, admins: string[]): boolean {
  return admins.includes(userId);
}

export function verifyHandshake(params: HandshakeParams): HandshakeResult {
  const { secret, user_id, user_name, configSecret, admins } = params;

  if (!secret || secret !== configSecret) {
    return { ok: false, error: "Invalid secret" };
  }

  if (!user_id) {
    return { ok: false, error: "Missing user_id" };
  }

  return {
    ok: true,
    user: {
      user_id,
      user_name: user_name ?? user_id,
      is_admin: isAdmin(user_id, admins),
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- extensions/homeassistant/src/auth.test.ts -v`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
scripts/committer "feat(homeassistant): add auth and permission module" extensions/homeassistant/src/auth.ts extensions/homeassistant/src/auth.test.ts
```

---

## Task 3: Tool Filtering

**Files:**

- Create: `extensions/homeassistant/src/tool-filter.ts`
- Create: `extensions/homeassistant/src/tool-filter.test.ts`

- [ ] **Step 1: Write failing tests for tool filtering**

```typescript
// extensions/homeassistant/src/tool-filter.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- extensions/homeassistant/src/tool-filter.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Implement tool filter**

```typescript
// extensions/homeassistant/src/tool-filter.ts

/**
 * Tool name patterns restricted from standard (non-admin) HA users.
 * These cover file system access, shell execution, and system admin tools.
 */
export const RESTRICTED_TOOL_PATTERNS: RegExp[] = [
  /^file_/,
  /^shell_/,
  /^bash$/,
  /^terminal/,
  /^exec/,
  /^system_/,
  /^admin_/,
  /^config_/,
  /^write$/,
  /^edit$/,
  /^delete$/,
];

export function filterToolsForUser<T extends { name: string }>(tools: T[], isAdmin: boolean): T[] {
  if (isAdmin) return tools;
  return tools.filter(
    (tool) => !RESTRICTED_TOOL_PATTERNS.some((pattern) => pattern.test(tool.name)),
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- extensions/homeassistant/src/tool-filter.test.ts -v`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
scripts/committer "feat(homeassistant): add tool filtering for permission tiers" extensions/homeassistant/src/tool-filter.ts extensions/homeassistant/src/tool-filter.test.ts
```

---

## Task 4: Conversation Persistence

**Files:**

- Create: `extensions/homeassistant/src/conversations.ts`
- Create: `extensions/homeassistant/src/conversations.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// extensions/homeassistant/src/conversations.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
    const c1 = await store.create("havnil");
    const c2 = await store.create("havnil");
    await store.appendMessage(c2.id, "havnil", {
      role: "user",
      text: "hello",
      timestamp: new Date().toISOString(),
    });

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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- extensions/homeassistant/src/conversations.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Implement ConversationStore**

```typescript
// extensions/homeassistant/src/conversations.ts
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { StoredMessage, ConversationSummary } from "./protocol.js";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: StoredMessage[];
}

export class ConversationStore {
  constructor(private readonly baseDir: string) {}

  private userDir(userId: string): string {
    return join(this.baseDir, userId);
  }

  private convPath(userId: string, convId: string): string {
    return join(this.userDir(userId), `${convId}.json`);
  }

  async create(userId: string): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const conv: Conversation = {
      id,
      user_id: userId,
      title: "New conversation",
      created_at: now,
      updated_at: now,
      messages: [],
    };
    await mkdir(this.userDir(userId), { recursive: true });
    await writeFile(this.convPath(userId, id), JSON.stringify(conv, null, 2));
    return conv;
  }

  async list(userId: string): Promise<ConversationSummary[]> {
    const dir = this.userDir(userId);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return [];
    }
    const convs: ConversationSummary[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(join(dir, file), "utf-8");
        const conv: Conversation = JSON.parse(raw);
        convs.push({
          id: conv.id,
          title: conv.title,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        });
      } catch {
        // skip corrupt files
      }
    }
    convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return convs;
  }

  async load(convId: string, userId: string): Promise<Conversation | null> {
    try {
      const raw = await readFile(this.convPath(userId, convId), "utf-8");
      const conv: Conversation = JSON.parse(raw);
      if (conv.user_id !== userId) return null;
      return conv;
    } catch {
      return null;
    }
  }

  async appendMessage(convId: string, userId: string, message: StoredMessage): Promise<void> {
    const conv = await this.load(convId, userId);
    if (!conv) return;
    conv.messages.push(message);
    conv.updated_at = new Date().toISOString();
    await writeFile(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
  }

  async delete(convId: string, userId: string): Promise<void> {
    const conv = await this.load(convId, userId);
    if (!conv) return;
    try {
      await rm(this.convPath(userId, convId));
    } catch {
      // already gone
    }
  }

  async rename(convId: string, userId: string, title: string): Promise<void> {
    const conv = await this.load(convId, userId);
    if (!conv) return;
    conv.title = title;
    conv.updated_at = new Date().toISOString();
    await writeFile(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- extensions/homeassistant/src/conversations.test.ts -v`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
scripts/committer "feat(homeassistant): add conversation persistence store" extensions/homeassistant/src/conversations.ts extensions/homeassistant/src/conversations.test.ts
```

---

## Task 5: WebSocket Connection Handler

**Files:**

- Create: `extensions/homeassistant/src/ws-handler.ts`

This is the core runtime handler. It manages WebSocket connections, dispatches messages to OpenClaw's AI pipeline, and streams responses back. Due to tight coupling with OpenClaw internals (gateway, AI pipeline, tool registry), unit testing this in isolation is limited. The Playwright E2E tests (Task 10) will cover the full integration.

- [ ] **Step 1: Implement WebSocket handler**

```typescript
// extensions/homeassistant/src/ws-handler.ts
import type { WebSocket } from "ws";
import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import { verifyHandshake } from "./auth.js";
import { filterToolsForUser } from "./tool-filter.js";
import { ConversationStore } from "./conversations.js";
import type { ClientMessage, ServerMessage, HaUserIdentity, StoredMessage } from "./protocol.js";

export interface HaWsHandlerDeps {
  configSecret: string;
  admins: string[];
  conversationStore: ConversationStore;
  /** Dispatch a user message through the AI pipeline and stream tokens back. */
  dispatchMessage: (params: {
    user: HaUserIdentity;
    text: string;
    conversationId: string;
    attachments?: Array<{ file_name: string; mime_type: string; data: string }>;
    onToken: (text: string) => void;
    onToolUse: (name: string, input: Record<string, unknown>) => void;
    onToolResult: (name: string, output: string, isError: boolean) => void;
    onDone: (fullText: string) => void;
    onError: (message: string) => void;
    signal: AbortSignal;
  }) => Promise<void>;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function handleHaWebSocket(
  ws: WebSocket,
  req: IncomingMessage,
  deps: HaWsHandlerDeps,
): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const secret = url.searchParams.get("secret") ?? undefined;
  const userId = url.searchParams.get("user_id") ?? undefined;
  const userName = url.searchParams.get("user_name") ?? undefined;

  const authResult = verifyHandshake({
    secret,
    user_id: userId,
    user_name: userName,
    configSecret: deps.configSecret,
    admins: deps.admins,
  });

  if (!authResult.ok) {
    send(ws, { type: "error", message: authResult.error });
    ws.close(4001, authResult.error);
    return;
  }

  const user = authResult.user;
  let activeAbortController: AbortController | null = null;
  let activeConversationId: string | null = null;

  // Keepalive ping every 30s
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) ws.ping();
  }, 30_000);

  ws.on("pong", () => {
    send(ws, { type: "pong" });
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
    activeAbortController?.abort();
  });

  ws.on("message", async (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    switch (msg.type) {
      case "list_conversations": {
        const list = await deps.conversationStore.list(user.user_id);
        send(ws, { type: "conversations", list });
        break;
      }

      case "new_conversation": {
        const conv = await deps.conversationStore.create(user.user_id);
        activeConversationId = conv.id;
        send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        break;
      }

      case "load_conversation": {
        const conv = await deps.conversationStore.load(msg.conversation_id, user.user_id);
        if (!conv) {
          send(ws, { type: "error", message: "Conversation not found" });
          break;
        }
        activeConversationId = conv.id;
        send(ws, {
          type: "conversation_loaded",
          id: conv.id,
          title: conv.title,
          messages: conv.messages,
        });
        break;
      }

      case "delete_conversation": {
        await deps.conversationStore.delete(msg.conversation_id, user.user_id);
        if (activeConversationId === msg.conversation_id) {
          activeConversationId = null;
        }
        send(ws, { type: "conversation_deleted", id: msg.conversation_id });
        break;
      }

      case "rename_conversation": {
        await deps.conversationStore.rename(msg.conversation_id, user.user_id, msg.title);
        send(ws, { type: "conversation_renamed", id: msg.conversation_id, title: msg.title });
        break;
      }

      case "stop_generating": {
        activeAbortController?.abort();
        activeAbortController = null;
        break;
      }

      case "message": {
        // Auto-create conversation if none active
        if (!activeConversationId) {
          const conv = await deps.conversationStore.create(user.user_id);
          activeConversationId = conv.id;
          send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        }

        const convId = msg.conversation_id ?? activeConversationId;

        // Save user message
        const userMsg: StoredMessage = {
          role: "user",
          text: msg.text,
          timestamp: new Date().toISOString(),
        };
        await deps.conversationStore.appendMessage(convId, user.user_id, userMsg);

        // Dispatch to AI
        const abortController = new AbortController();
        activeAbortController = abortController;

        const toolCalls: StoredMessage["tool_calls"] = [];
        let fullText = "";

        try {
          await deps.dispatchMessage({
            user,
            text: msg.text,
            conversationId: convId,
            onToken: (text) => {
              fullText += text;
              send(ws, { type: "token", text });
            },
            onToolUse: (name, input) => {
              send(ws, { type: "tool_use", name, input });
            },
            onToolResult: (name, output, isError) => {
              toolCalls.push({ name, input: {}, output });
              send(ws, { type: "tool_result", name, output, is_error: isError || undefined });
            },
            onDone: (text) => {
              fullText = text;
              send(ws, { type: "done", full_text: text });
            },
            onError: (message) => {
              send(ws, { type: "error", message });
            },
            signal: abortController.signal,
          });

          // Save assistant message
          const assistantMsg: StoredMessage = {
            role: "assistant",
            text: fullText,
            timestamp: new Date().toISOString(),
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          };
          await deps.conversationStore.appendMessage(convId, user.user_id, assistantMsg);
        } catch (err) {
          if (!abortController.signal.aborted) {
            send(ws, { type: "error", message: String(err) });
          }
        } finally {
          activeAbortController = null;
        }
        break;
      }

      case "upload": {
        if (!activeConversationId) {
          const conv = await deps.conversationStore.create(user.user_id);
          activeConversationId = conv.id;
          send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        }

        const convId = activeConversationId;
        const abortController = new AbortController();
        activeAbortController = abortController;

        const userMsg: StoredMessage = {
          role: "user",
          text: `[Uploaded: ${msg.file_name}]`,
          timestamp: new Date().toISOString(),
          attachments: [{ file_name: msg.file_name, mime_type: msg.mime_type }],
        };
        await deps.conversationStore.appendMessage(convId, user.user_id, userMsg);

        let fullText = "";
        try {
          await deps.dispatchMessage({
            user,
            text: `[User uploaded file: ${msg.file_name}]`,
            conversationId: convId,
            attachments: [{ file_name: msg.file_name, mime_type: msg.mime_type, data: msg.data }],
            onToken: (text) => {
              fullText += text;
              send(ws, { type: "token", text });
            },
            onToolUse: (name, input) => send(ws, { type: "tool_use", name, input }),
            onToolResult: (name, output, isError) =>
              send(ws, { type: "tool_result", name, output, is_error: isError || undefined }),
            onDone: (text) => {
              fullText = text;
              send(ws, { type: "done", full_text: text });
            },
            onError: (message) => send(ws, { type: "error", message }),
            signal: abortController.signal,
          });

          const assistantMsg: StoredMessage = {
            role: "assistant",
            text: fullText,
            timestamp: new Date().toISOString(),
          };
          await deps.conversationStore.appendMessage(convId, user.user_id, assistantMsg);
        } catch (err) {
          if (!abortController.signal.aborted) {
            send(ws, { type: "error", message: String(err) });
          }
        } finally {
          activeAbortController = null;
        }
        break;
      }
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
scripts/committer "feat(homeassistant): add WebSocket connection handler" extensions/homeassistant/src/ws-handler.ts
```

---

## Task 6: Update Plugin Entry — Register Channel + WebSocket Route

**Files:**

- Modify: `extensions/homeassistant/index.ts`
- Modify: `extensions/homeassistant/openclaw.plugin.json`
- Modify: `extensions/homeassistant/package.json`

- [ ] **Step 1: Update plugin manifest**

Replace `extensions/homeassistant/openclaw.plugin.json` with:

```json
{
  "id": "homeassistant",
  "name": "Home Assistant",
  "description": "Home Assistant channel and tools — chat interface with WebSocket streaming and REST API control",
  "enabledByDefault": false,
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["token"],
    "properties": {
      "url": {
        "type": "string",
        "description": "Base URL of your Home Assistant instance",
        "default": "http://localhost:8123"
      },
      "token": {
        "type": "string",
        "description": "Long-lived access token from your HA profile"
      },
      "secret": {
        "type": "string",
        "description": "Shared secret for WebSocket authentication"
      },
      "admins": {
        "type": "array",
        "items": { "type": "string" },
        "description": "List of HA user IDs with full admin access",
        "default": []
      }
    }
  }
}
```

- [ ] **Step 2: Update index.ts to register tools and WebSocket route**

Replace `extensions/homeassistant/index.ts` with the full updated file that:

1. Keeps all 4 existing HA tools (get_states, call_service, get_history, fire_event)
2. Registers an HTTP upgrade route for WebSocket at `/homeassistant/ws`
3. Creates a `ConversationStore` and wires up `handleHaWebSocket`
4. Provides a `dispatchMessage` implementation that bridges to OpenClaw's AI pipeline

The exact integration with `registerPluginHttpRoute` and the AI dispatch pipeline will depend on the plugin SDK surface available at implementation time. The implementer should:

- Read `src/plugins/http-registry.ts` for `registerPluginHttpRoute`
- Read `src/auto-reply/dispatch.ts` for `dispatchInboundMessage`
- Read `src/gateway/server/ws-connection.ts` for WebSocket upgrade patterns
- Wire the `dispatchMessage` callback to use `dispatchInboundMessage` with the user's tool scope (filtered via `filterToolsForUser`)

```typescript
// extensions/homeassistant/index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "typebox";
import { WebSocketServer } from "ws";
import { ConversationStore } from "./src/conversations.js";
import { handleHaWebSocket } from "./src/ws-handler.js";
import { join } from "node:path";
import { homedir } from "node:os";

interface HaConfig {
  url?: string;
  token: string;
  secret?: string;
  admins?: string[];
}

function haClient(config: HaConfig) {
  const base = (config.url ?? "http://localhost:8123").replace(/\/$/, "");
  const headers = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  async function request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`HA API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  return { request };
}

export default definePluginEntry({
  id: "homeassistant",
  name: "Home Assistant",
  description:
    "Home Assistant channel and tools — chat interface with WebSocket streaming and REST API control",
  register(api) {
    const cfg = api.pluginConfig as HaConfig;
    const ha = haClient(cfg);

    // ── Existing HA tools (unchanged) ─────────────────────────────────────

    api.registerTool({
      name: "ha_get_states",
      description:
        "Get the current state of one or all Home Assistant entities. " +
        "Pass an entity_id to get a single entity, or omit it to get all states.",
      parameters: Type.Object({
        entity_id: Type.Optional(Type.String({ description: "Entity ID, e.g. light.living_room" })),
      }),
      async execute(_id, params) {
        const path = params.entity_id ? `/api/states/${params.entity_id}` : "/api/states";
        const data = await ha.request("GET", path);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      },
    });

    api.registerTool({
      name: "ha_call_service",
      description:
        "Call a Home Assistant service. Examples: " +
        "domain=light service=turn_on, domain=switch service=toggle, " +
        "domain=climate service=set_temperature. " +
        "Pass service_data for extra fields (brightness, temperature, etc).",
      parameters: Type.Object({
        domain: Type.String({ description: "Service domain, e.g. light, switch, climate" }),
        service: Type.String({ description: "Service name, e.g. turn_on, turn_off, toggle" }),
        service_data: Type.Optional(
          Type.Record(Type.String(), Type.Unknown(), {
            description: "Extra fields, e.g. { entity_id: 'light.kitchen', brightness: 128 }",
          }),
        ),
      }),
      async execute(_id, params) {
        const data = await ha.request(
          "POST",
          `/api/services/${params.domain}/${params.service}`,
          params.service_data ?? {},
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      },
    });

    api.registerTool(
      {
        name: "ha_get_history",
        description: "Get state change history for one or more entities over a time range.",
        parameters: Type.Object({
          entity_ids: Type.Array(Type.String(), {
            description: "List of entity IDs to query",
          }),
          hours_back: Type.Optional(
            Type.Number({
              description: "How many hours of history to fetch (default 24)",
              default: 24,
            }),
          ),
        }),
        async execute(_id, params) {
          const hours = params.hours_back ?? 24;
          const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
          const ids = params.entity_ids.join(",");
          const data = await ha.request(
            "GET",
            `/api/history/period/${start}?filter_entity_id=${ids}&minimal_response`,
          );
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          };
        },
      },
      { optional: true },
    );

    api.registerTool(
      {
        name: "ha_fire_event",
        description: "Fire a custom Home Assistant event.",
        parameters: Type.Object({
          event_type: Type.String({ description: "Event type to fire" }),
          event_data: Type.Optional(
            Type.Record(Type.String(), Type.Unknown(), {
              description: "Payload to attach to the event",
            }),
          ),
        }),
        async execute(_id, params) {
          const data = await ha.request(
            "POST",
            `/api/events/${params.event_type}`,
            params.event_data ?? {},
          );
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          };
        },
      },
      { optional: true },
    );

    // ── WebSocket channel ─────────────────────────────────────────────────

    if (cfg.secret) {
      const conversationStore = new ConversationStore(
        join(homedir(), ".openclaw", "homeassistant", "conversations"),
      );

      // Register HTTP route that handles WebSocket upgrade
      // The implementer should use registerPluginHttpRoute here,
      // following the pattern in src/plugins/http-registry.ts.
      // The handler should check for upgrade headers and call
      // handleHaWebSocket for WebSocket connections.
      //
      // Pseudo-code for the integration:
      //
      // registerPluginHttpRoute({
      //   path: "/homeassistant/ws",
      //   auth: "none",
      //   handler: async (req, res) => {
      //     // Handle WebSocket upgrade
      //     const wss = new WebSocketServer({ noServer: true });
      //     req.socket.server.on("upgrade", (upgradeReq, socket, head) => {
      //       if (new URL(upgradeReq.url, "http://localhost").pathname === "/homeassistant/ws") {
      //         wss.handleUpgrade(upgradeReq, socket, head, (ws) => {
      //           handleHaWebSocket(ws, upgradeReq, {
      //             configSecret: cfg.secret!,
      //             admins: cfg.admins ?? [],
      //             conversationStore,
      //             dispatchMessage: async (params) => {
      //               // Bridge to OpenClaw AI pipeline
      //               // Use dispatchInboundMessage from src/auto-reply/dispatch.ts
      //             },
      //           });
      //         });
      //       }
      //     });
      //     return true;
      //   },
      //   pluginId: "homeassistant",
      // });

      api.logger.info("Home Assistant WebSocket channel registered at /homeassistant/ws");
    }

    api.logger.info(
      `Home Assistant plugin registered (4 tools${cfg.secret ? " + WebSocket channel" : ""})`,
    );
  },
});
```

**Note to implementer:** The WebSocket upgrade integration and AI pipeline dispatch are the most codebase-specific parts. You must read the following files at implementation time and adapt:

- `src/plugins/http-registry.ts` — how to register an HTTP route
- `src/gateway/server/ws-connection.ts` — how the gateway handles WebSocket upgrades
- `src/auto-reply/dispatch.ts` — how to dispatch a message to the AI pipeline
- `src/agents/tool-policy-pipeline.ts` — how to apply tool filtering per session

- [ ] **Step 3: Commit**

```bash
scripts/committer "feat(homeassistant): register WebSocket channel route and update manifest" extensions/homeassistant/index.ts extensions/homeassistant/openclaw.plugin.json
```

---

## Task 7: HA Custom Component — Python Integration

**Files:**

- Create: `custom_components/openclaw/__init__.py`
- Create: `custom_components/openclaw/manifest.json`
- Create: `custom_components/openclaw/const.py`
- Create: `custom_components/openclaw/config_flow.py`
- Create: `custom_components/openclaw/translations/en.json`

**Note:** These files live in the HA config directory, NOT in the OpenClaw repo. The implementer should determine the HA config directory path (typically `~/.homeassistant/` or `/config/` in Docker). For development, create them in `extensions/homeassistant/ha-component/custom_components/openclaw/` and symlink.

- [ ] **Step 1: Create constants**

```python
# custom_components/openclaw/const.py
DOMAIN = "openclaw"
DEFAULT_WS_URL = "ws://localhost:18789/homeassistant/ws"
CONF_WS_URL = "ws_url"
CONF_SECRET = "secret"
```

- [ ] **Step 2: Create manifest**

```json
{
  "domain": "openclaw",
  "name": "OpenClaw",
  "version": "1.0.0",
  "documentation": "https://docs.openclaw.ai/channels/homeassistant",
  "requirements": [],
  "codeowners": [],
  "iot_class": "local_push",
  "config_flow": true
}
```

- [ ] **Step 3: Create config flow**

```python
# custom_components/openclaw/config_flow.py
import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN, DEFAULT_WS_URL, CONF_WS_URL, CONF_SECRET


class OpenClawConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow for OpenClaw."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            # TODO: test WebSocket connection here
            return self.async_create_entry(title="OpenClaw", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_WS_URL, default=DEFAULT_WS_URL): str,
                    vol.Required(CONF_SECRET): str,
                }
            ),
            errors=errors,
        )
```

- [ ] **Step 4: Create integration init**

```python
# custom_components/openclaw/__init__.py
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from .const import DOMAIN, CONF_WS_URL, CONF_SECRET


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up OpenClaw from a config entry."""
    ws_url = entry.data[CONF_WS_URL]
    secret = entry.data[CONF_SECRET]

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "ws_url": ws_url,
        "secret": secret,
    }

    # Register the sidebar panel
    hass.components.frontend.async_register_built_in_panel(
        "custom",
        sidebar_title="OpenClaw",
        sidebar_icon="mdi:chat",
        frontend_url_path="openclaw",
        config={"ws_url": ws_url, "secret": secret},
        require_admin=False,
    )

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload OpenClaw config entry."""
    hass.components.frontend.async_remove_panel("openclaw")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
```

- [ ] **Step 5: Create translations**

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Connect to OpenClaw",
        "description": "Enter your OpenClaw gateway details.",
        "data": {
          "ws_url": "WebSocket URL",
          "secret": "Shared Secret"
        }
      }
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
scripts/committer "feat(homeassistant): add HA custom component for sidebar panel" \
  extensions/homeassistant/ha-component/custom_components/openclaw/__init__.py \
  extensions/homeassistant/ha-component/custom_components/openclaw/manifest.json \
  extensions/homeassistant/ha-component/custom_components/openclaw/const.py \
  extensions/homeassistant/ha-component/custom_components/openclaw/config_flow.py \
  extensions/homeassistant/ha-component/custom_components/openclaw/translations/en.json
```

---

## Task 8: Chat Panel UI — LitElement Component

**Files:**

- Create: `extensions/homeassistant/ha-component/custom_components/openclaw/frontend/openclaw-panel.js`

This is the largest single file — the ChatGPT-style chat UI. It is a self-contained LitElement web component.

- [ ] **Step 1: Create the chat panel**

The panel must implement:

1. **WebSocket management** — connect, reconnect, ping/pong, message parsing
2. **Conversation sidebar** — drawer on mobile, persistent on desktop, new/load/delete/rename
3. **Message rendering** — bubbles, markdown (use a lightweight markdown renderer or simple regex-based), code blocks
4. **Tool call cards** — collapsible inline cards
5. **Input bar** — auto-grow textarea, send button, mic button, attachment button
6. **Streaming** — typing indicator, token-by-token append, stop button
7. **Mobile-first** — safe area insets, keyboard handling, 44px touch targets, swipe-to-delete
8. **Theming** — HA CSS custom properties

The full JS source is ~800-1000 lines. Key structure:

```javascript
// extensions/homeassistant/ha-component/custom_components/openclaw/frontend/openclaw-panel.js

class OpenClawPanel extends HTMLElement {
  // Properties: hass, panel (injected by HA), _ws, _messages, _conversations,
  // _activeConversation, _isStreaming, _isRecording, _sidebarOpen

  constructor() {
    /* init state */
  }
  connectedCallback() {
    /* render, connect WS */
  }
  disconnectedCallback() {
    /* cleanup WS, intervals */
  }

  // ── WebSocket ──
  _connectWs() {
    /* open WS with secret + hass.user.id, setup handlers */
  }
  _onWsMessage(msg) {
    /* route by msg.type to handlers */
  }
  _send(msg) {
    /* JSON.stringify and send */
  }
  _reconnect() {
    /* exponential backoff reconnect */
  }

  // ── Conversations ──
  _loadConversations() {
    /* send list_conversations */
  }
  _newConversation() {
    /* send new_conversation */
  }
  _selectConversation(id) {
    /* send load_conversation */
  }
  _deleteConversation(id) {
    /* send delete_conversation */
  }
  _renameConversation(id, title) {
    /* send rename_conversation */
  }

  // ── Messages ──
  _sendMessage() {
    /* read input, send message, optimistic UI */
  }
  _stopGenerating() {
    /* send stop_generating */
  }
  _handleToken(text) {
    /* append to streaming message */
  }
  _handleDone(fullText) {
    /* finalize message */
  }
  _handleToolUse(name, input) {
    /* add tool card */
  }
  _handleToolResult(name, output) {
    /* update tool card */
  }

  // ── Voice ──
  _toggleVoice() {
    /* start/stop SpeechRecognition */
  }

  // ── Upload ──
  _openFilePicker() {
    /* trigger file input */
  }
  _handleFileSelected(file) {
    /* read, base64, send upload msg */
  }

  // ── Rendering ──
  _render() {
    /* full DOM render */
  }
  _renderSidebar() {
    /* conversation list */
  }
  _renderMessages() {
    /* message bubbles + tool cards */
  }
  _renderInputBar() {
    /* textarea + buttons */
  }
  _renderMarkdown(text) {
    /* simple markdown to HTML */
  }

  // ── Styles ──
  _getStyles() {
    /* return <style> tag with HA CSS vars */
  }
}

customElements.define("openclaw-panel", OpenClawPanel);
```

The implementer should write the full component following this skeleton. Key implementation details:

**Markdown rendering:** Use simple regex replacements for bold (`**text**`), italic (`*text*`), code blocks (triple backtick), inline code (single backtick), links (`[text](url)`), and lists. No external dependency needed.

**Mobile keyboard handling:**

```javascript
// In connectedCallback:
window.visualViewport?.addEventListener("resize", () => {
  // Adjust input bar position when keyboard opens/closes
  const offset = window.innerHeight - window.visualViewport.height;
  inputBar.style.transform = `translateY(-${offset}px)`;
});
```

**Safe area insets:**

```css
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-top: env(safe-area-inset-top, 0px);
```

**Swipe-to-delete on conversation list:**

```javascript
// Track touch start/move/end on conversation items
// If swipe distance > 80px left, reveal delete button
```

**Auto-scroll:**

```javascript
// After each token, check if user was at bottom
// If yes, scroll to bottom. If no, don't (user scrolled up).
const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
if (isAtBottom) container.scrollTop = container.scrollHeight;
```

- [ ] **Step 2: Commit**

```bash
scripts/committer "feat(homeassistant): add LitElement chat panel UI" \
  extensions/homeassistant/ha-component/custom_components/openclaw/frontend/openclaw-panel.js
```

---

## Task 9: HACS Packaging

**Files:**

- Create: `extensions/homeassistant/ha-component/hacs.json`
- Create: `extensions/homeassistant/ha-component/README.md`

- [ ] **Step 1: Create hacs.json**

```json
{
  "name": "OpenClaw",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

- [ ] **Step 2: Create README for HACS**

````markdown
# OpenClaw for Home Assistant

A ChatGPT-style AI chat panel for Home Assistant, powered by OpenClaw.

## Features

- ChatGPT-style chat interface in HA sidebar
- Token-by-token streaming responses
- Conversation history with persistence
- Voice input (speech-to-text)
- File and image uploads
- Per-user permissions (admin vs standard)
- Works great on HA Companion App (mobile-first design)
- Dark/light theme support

## Installation

### HACS (recommended)

1. Open HACS in your HA instance
2. Add this repository as a custom repository
3. Search for "OpenClaw" and install
4. Restart Home Assistant
5. Go to Settings > Integrations > Add Integration > OpenClaw
6. Enter your OpenClaw gateway WebSocket URL and shared secret

### Manual

1. Copy `custom_components/openclaw/` to your HA config directory
2. Restart Home Assistant
3. Go to Settings > Integrations > Add Integration > OpenClaw
4. Enter your OpenClaw gateway WebSocket URL and shared secret

## OpenClaw Configuration

In your OpenClaw config, enable the Home Assistant plugin:

```yaml
plugins:
  homeassistant:
    enabled: true
    url: "http://localhost:8123"
    token: "<your-ha-long-lived-access-token>"
    secret: "<shared-secret>"
    admins:
      - "<your-ha-user-id>"
```
````

Admin users get full OpenClaw access. Other HA users get OpenClaw + HA tools but without file/shell/system access.

````

- [ ] **Step 3: Commit**

```bash
scripts/committer "feat(homeassistant): add HACS packaging" \
  extensions/homeassistant/ha-component/hacs.json \
  extensions/homeassistant/ha-component/README.md
````

---

## Task 10: Playwright E2E Tests

**Files:**

- Create: `extensions/homeassistant/tests/e2e/ha-panel.e2e.test.ts`

**Prerequisites:** HA must be running locally with the OpenClaw custom component installed. OpenClaw gateway must be running with the homeassistant plugin enabled. The test assumes HA is at `http://localhost:8123`.

- [ ] **Step 1: Create Playwright test file**

```typescript
// extensions/homeassistant/tests/e2e/ha-panel.e2e.test.ts
import { test, expect } from "@playwright/test";

const HA_URL = process.env.HA_URL ?? "http://localhost:8123";
const HA_USERNAME = process.env.HA_USERNAME ?? "havnil";
const HA_PASSWORD = process.env.HA_PASSWORD!;

test.describe("OpenClaw HA Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Login to HA
    await page.goto(HA_URL);
    await page.fill('input[name="username"]', HA_USERNAME);
    await page.fill('input[name="password"]', HA_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/lovelace/**", { timeout: 10_000 });
  });

  test("panel appears in sidebar", async ({ page }) => {
    const sidebar = page.locator("ha-sidebar");
    await expect(sidebar.locator('a[data-panel="openclaw"]')).toBeVisible();
  });

  test("opens panel and shows chat UI", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Should see input bar
    await expect(page.locator("openclaw-panel textarea")).toBeVisible();
    // Should see new chat button or empty state
    await expect(page.locator("openclaw-panel")).toContainText(/new chat|start a conversation/i);
  });

  test("sends message and receives streaming response", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const textarea = page.locator("openclaw-panel textarea");
    await textarea.fill("Hello, what can you do?");
    await page.locator("openclaw-panel .send-button").click();

    // User message should appear immediately (optimistic UI)
    await expect(page.locator("openclaw-panel .message.user")).toContainText(
      "Hello, what can you do?",
    );

    // Wait for assistant response (streaming)
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });
    // Response should have some text
    const assistantMsg = page.locator("openclaw-panel .message.assistant").first();
    await expect(assistantMsg).not.toBeEmpty();
  });

  test("conversation persists after reload", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const textarea = page.locator("openclaw-panel textarea");
    await textarea.fill("Remember: test persistence");
    await page.locator("openclaw-panel .send-button").click();

    // Wait for response
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Reload
    await page.reload();
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Open conversation list and select the conversation
    // The conversation should still be there
    await expect(page.locator("openclaw-panel .conversation-item")).toHaveCount(1, {
      timeout: 5_000,
    });
  });

  test("creates and switches conversations", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Send first message
    await page.locator("openclaw-panel textarea").fill("First conversation");
    await page.locator("openclaw-panel .send-button").click();
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Create new conversation
    await page.locator("openclaw-panel .new-chat-button").click();

    // Send second message
    await page.locator("openclaw-panel textarea").fill("Second conversation");
    await page.locator("openclaw-panel .send-button").click();
    await expect(page.locator("openclaw-panel .message.assistant")).toBeVisible({
      timeout: 30_000,
    });

    // Should have 2 conversations in sidebar
    await expect(page.locator("openclaw-panel .conversation-item")).toHaveCount(2, {
      timeout: 5_000,
    });
  });

  test("mobile viewport has proper layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Input bar should be visible
    await expect(page.locator("openclaw-panel textarea")).toBeVisible();

    // Send button should be at least 44px
    const sendButton = page.locator("openclaw-panel .send-button");
    const box = await sendButton.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("voice input button is visible", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    // Mic button should be visible (unless Web Speech API unavailable)
    const micButton = page.locator("openclaw-panel .mic-button");
    // In Playwright's Chromium, Web Speech API is available
    await expect(micButton).toBeVisible();
  });

  test("file upload button opens picker", async ({ page }) => {
    await page.click('a[data-panel="openclaw"]');
    await page.waitForSelector("openclaw-panel", { timeout: 5_000 });

    const attachButton = page.locator("openclaw-panel .attach-button");
    await expect(attachButton).toBeVisible();

    // Clicking should trigger hidden file input
    const fileInput = page.locator('openclaw-panel input[type="file"]');
    await expect(fileInput).toHaveCount(1);
  });
});
```

- [ ] **Step 2: Commit**

```bash
scripts/committer "test(homeassistant): add Playwright E2E tests for HA chat panel" \
  extensions/homeassistant/tests/e2e/ha-panel.e2e.test.ts
```

---

## Task 11: Integration Wiring and Smoke Test

This is the final integration task where all pieces get wired together and tested end-to-end.

- [ ] **Step 1: Verify OpenClaw plugin loads**

Run: `pnpm openclaw config set plugins.homeassistant.enabled true`
Run: `pnpm openclaw config set plugins.homeassistant.token "<ha-token>"`
Run: `pnpm openclaw config set plugins.homeassistant.secret "test-secret-123"`
Run: `pnpm openclaw config set plugins.homeassistant.admins '["havnil"]'`

Verify the plugin loads without errors in the gateway log.

- [ ] **Step 2: Install HA custom component**

```bash
# Find HA config directory
HA_CONFIG=$(find /Users/admin -name "configuration.yaml" -path "*/homeassistant/*" -not -path "*/node_modules/*" 2>/dev/null | head -1 | xargs dirname)
# or common locations: ~/.homeassistant, /config

# Symlink the custom component
ln -sf "$(pwd)/extensions/homeassistant/ha-component/custom_components/openclaw" "$HA_CONFIG/custom_components/openclaw"
```

Restart HA and verify the integration appears in Settings > Integrations.

- [ ] **Step 3: Configure and verify panel**

1. Add OpenClaw integration in HA UI — enter WebSocket URL and secret
2. Verify "OpenClaw" appears in HA sidebar
3. Open the panel on the companion app
4. Send a test message and verify streaming response
5. Test with a non-admin HA user to verify restricted tools

- [ ] **Step 4: Run unit tests**

Run: `pnpm test -- extensions/homeassistant/ -v`
Expected: all unit tests pass

- [ ] **Step 5: Run E2E tests**

Run: `HA_PASSWORD=<password> npx playwright test extensions/homeassistant/tests/e2e/`
Expected: all E2E tests pass

- [ ] **Step 6: Final commit**

```bash
scripts/committer "feat(homeassistant): complete channel integration wiring" <any-remaining-files>
```
