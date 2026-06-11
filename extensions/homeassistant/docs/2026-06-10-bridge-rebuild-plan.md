# HA panel bridge rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the HA panel's gateway-WebSocket transport with a stable, plugin-owned HTTP + SSE API so the panel survives gateway upgrades, while keeping the existing UI, tools, store, and voice.

**Architecture:** Panel uses plain `fetch` + `EventSource` against routes the plugin registers with `api.registerHttpRoute` (raw Node `req`/`res`, so SSE works). The plugin dispatches to the agent **in-process** (`createChannelReplyPipeline` + `dispatchInboundMessage`) and pushes reply tokens to per-conversation SSE subscribers via a small in-memory hub. The gateway wire protocol disappears from the panel entirely.

**Tech Stack:** TypeScript (ESM), Node `http` `IncomingMessage`/`ServerResponse`, Vitest, `openclaw/plugin-sdk/*`, browser `fetch`/`EventSource`.

**Reference design:** `extensions/homeassistant/docs/2026-06-10-bridge-rebuild-design.md`

**Working location:** a git worktree/branch off current `main` (see Task 0). Do NOT edit the live-served panel (`~/dev/project_jarvis/...`) until Task 8.

---

## File structure

- Create `extensions/homeassistant/src/stream-hub.ts` — in-memory per-conversation SSE pub/sub (subscribe, publish, unsubscribe).
- Create `extensions/homeassistant/src/stream-hub.test.ts`
- Create `extensions/homeassistant/src/http-api.ts` — the stable HTTP handlers: `send`, `stream` (SSE), `conversations`, `transcribe`. Owns request parsing, auth, CORS.
- Create `extensions/homeassistant/src/http-api.test.ts`
- Modify `extensions/homeassistant/src/channel.ts` — add `onToolActivity` already present; expose store getter (already present). No transport here.
- Modify `extensions/homeassistant/index.ts` — register HTTP routes; keep in-process `setHaDispatch`; route dispatch callbacks into the stream hub; ensure the channel entry satisfies the bundled-channel-entry contract.
- Delete `extensions/homeassistant/src/gateway-methods.ts` + `gateway-methods.test.ts` — replaced by `http-api.ts`.
- Modify `extensions/homeassistant/ha-component/custom_components/openclaw/frontend/openclaw-panel.js` — swap transport functions (`_connectGateway`, `_gwRequest`, `_handleEvent`, `_send`/`_doSend`, conversation calls) to `fetch` + `EventSource`. Keep all UI/render code.
- Bump panel cache version in `ha-component/custom_components/openclaw/__init__.py` (`?v=`).

---

## Task 0: Isolated workspace

- [ ] **Step 1: Create a branch/worktree** (REQUIRED SUB-SKILL: superpowers:using-git-worktrees)

Run: `git worktree add ../openclaw-ha-bridge -b ha-bridge-rebuild`
Expected: new worktree at `../openclaw-ha-bridge` on branch `ha-bridge-rebuild`. Do all work there. `pnpm install` once in the worktree.

---

## Task 1: Confirm in-process dispatch produces a reply, and fix the channel-entry contract

This de-risks everything: the whole design assumes the plugin can dispatch to the agent in-process and get streamed tokens. The Anthropic key is now registered, so this should work; verify it and fix the `bundled-channel-entry` skip.

**Files:**

- Test: `extensions/homeassistant/src/dispatch-smoke.test.ts` (create, temporary — delete after Task 5)
- Modify: `extensions/homeassistant/index.ts`, `extensions/homeassistant/openclaw.plugin.json`

- [ ] **Step 1: Read the contract + current entry**

Read `src/channels/plugins/bundled.ts:36-55` (the `BundledChannelEntryRuntimeContract`: needs `kind: "bundled-channel-entry"`, `id`, `name`, `description`, `register`, `loadChannelPlugin`). Read how `defineChannelPluginEntry` (`src/plugin-sdk/core.ts`) produces an entry and compare to the contract. Read the live warning source: `git grep -n "missing bundled-channel-entry contract" src`.

- [ ] **Step 2: Make `index.ts`'s default export satisfy the contract**

`defineChannelPluginEntry({...})` must yield an object whose runtime shape matches `BundledChannelEntryRuntimeContract`. If the SDK helper already does and discovery still skips, the gap is in `openclaw.plugin.json` channel metadata (`openclaw.channel.id` must equal the plugin id `homeassistant`, and the entry path must be one of `index.ts`/`channel-entry.ts`/`setup-entry.ts`). Align them. Show the exact `openclaw.plugin.json` `channel` block and `index.ts` export after the change.

- [ ] **Step 3: Write a dispatch smoke check**

```ts
// dispatch-smoke.test.ts — proves in-process dispatch yields tokens for channel "homeassistant"
import { describe, it, expect, vi } from "vitest";
// Import the dispatch wiring factory (extract from index.ts in Step 5 if not already a function).
import { runHaDispatch } from "./dispatch.js"; // created in Task 5; for now inline the index.ts dispatch body
// Mock the SDK reply-runtime to assert our callbacks fire (no real model call):
// vi.mock("openclaw/plugin-sdk/reply-runtime", ...) returning a dispatcher whose deliver() emits a block reply.
it("emits onToken then onDone for an inbound HA message", async () => {
  const tokens: string[] = [];
  let done = "";
  await runHaDispatch({
    cfg: {} as any,
    user: { user_id: "u", user_name: "U", is_admin: true } as any,
    text: "hei",
    conversationId: "c1",
    onToken: (t) => tokens.push(t),
    onToolActivity: () => {},
    onDone: (d) => (done = d),
    onError: () => {},
    signal: new AbortController().signal,
  });
  expect(done.length).toBeGreaterThan(0);
});
```

- [ ] **Step 4: Run it** — `pnpm test -- extensions/homeassistant/src/dispatch-smoke.test.ts`. Expected: PASS (with the reply-runtime mocked). If it fails because the channel string isn't accepted, that points at the contract fix in Step 2.

- [ ] **Step 5: Live sanity** — restart the worktree gateway against a scratch port and `curl` is not possible yet; instead assert no `missing bundled-channel-entry contract` warning appears: `openclaw doctor 2>&1 | grep -i homeassistant` shows the channel without the skip warning.

- [ ] **Step 6: Commit** — `scripts/committer "homeassistant: satisfy bundled-channel-entry contract; verify in-process dispatch" extensions/homeassistant/index.ts extensions/homeassistant/openclaw.plugin.json extensions/homeassistant/src/dispatch-smoke.test.ts`

---

## Task 2: Stream hub (per-conversation SSE pub/sub)

**Files:** Create `extensions/homeassistant/src/stream-hub.ts` + `stream-hub.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { StreamHub } from "./stream-hub.js";

describe("StreamHub", () => {
  it("delivers published events to subscribers of the same conversation only", () => {
    const hub = new StreamHub();
    const a: unknown[] = [];
    const b: unknown[] = [];
    const unsubA = hub.subscribe("c1", (e) => a.push(e));
    hub.subscribe("c2", (e) => b.push(e));
    hub.publish("c1", { type: "token", token: "hi" });
    expect(a).toEqual([{ type: "token", token: "hi" }]);
    expect(b).toEqual([]);
    unsubA();
    hub.publish("c1", { type: "done" });
    expect(a).toHaveLength(1); // no delivery after unsubscribe
  });
});
```

- [ ] **Step 2: Run → FAIL** (`pnpm test -- extensions/homeassistant/src/stream-hub.test.ts`), "Cannot find module".

- [ ] **Step 3: Implement**

```ts
export type HaStreamEvent =
  | { type: "token"; token: string }
  | { type: "tool" }
  | { type: "done"; full_text?: string }
  | { type: "error"; error: string }
  | { type: "title"; title: string };

type Listener = (event: HaStreamEvent) => void;

export class StreamHub {
  private subs = new Map<string, Set<Listener>>();
  subscribe(conversationId: string, listener: Listener): () => void {
    let set = this.subs.get(conversationId);
    if (!set) {
      set = new Set();
      this.subs.set(conversationId, set);
    }
    set.add(listener);
    return () => {
      const s = this.subs.get(conversationId);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) this.subs.delete(conversationId);
    };
  }
  publish(conversationId: string, event: HaStreamEvent): void {
    const set = this.subs.get(conversationId);
    if (!set) return;
    for (const l of [...set]) l(event);
  }
}
```

- [ ] **Step 4: Run → PASS**.
- [ ] **Step 5: Commit** — `scripts/committer "homeassistant: add StreamHub for SSE fan-out" extensions/homeassistant/src/stream-hub.ts extensions/homeassistant/src/stream-hub.test.ts`

---

## Task 3: HTTP API — `send` + `stream` (SSE)

This is the core. `send` dispatches in-process and publishes events to the hub; `stream` is an SSE response that subscribes and writes `data:` frames.

**Files:** Create `extensions/homeassistant/src/http-api.ts` + `http-api.test.ts`. Depends on Task 2 hub + the dispatch function (Task 5 extracts `runHaDispatch`; for this task, inject dispatch as a parameter so the API is testable in isolation).

- [ ] **Step 1: Write failing tests** (HTTP-level, with a fake dispatch + the real hub)

```ts
import { describe, it, expect, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { StreamHub } from "./stream-hub.js";
import { createHaHttpApi } from "./http-api.js";

function mkReq(method: string, url: string, body?: unknown, secret = "s") {
  const req = new IncomingMessage(new Socket());
  req.method = method;
  req.url = url;
  req.headers["x-openclaw-secret"] = secret;
  if (body !== undefined) {
    req.push(JSON.stringify(body));
    req.push(null);
  } else req.push(null);
  return req;
}
function mkRes() {
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  const chunks: string[] = [];
  // @ts-expect-error capture writes
  res.write = (c: string) => {
    chunks.push(c);
    return true;
  };
  // @ts-expect-error capture end
  res.end = (c?: string) => {
    if (c) chunks.push(c);
    return res;
  };
  return { res, chunks };
}

describe("HA HTTP API", () => {
  const store = {
    create: vi.fn(async () => ({ id: "c1", title: "New conversation" })),
    appendMessage: vi.fn(async () => {}),
    load: vi.fn(async () => ({ id: "c1", title: "New conversation", messages: [] })),
    rename: vi.fn(async () => {}),
    list: vi.fn(async () => []),
    delete: vi.fn(async () => {}),
  };
  const dispatch = vi.fn(async (p: any) => {
    p.onToken("he");
    p.onToken("i");
    p.onDone("hei");
  });
  const api = createHaHttpApi({
    hub: new StreamHub(),
    getStore: () => store as any,
    getDispatch: () => dispatch as any,
    getSecret: () => "s",
    resolveUser: () => ({ user_id: "havnil", user_name: "Havard", is_admin: true }),
  });

  it("rejects a wrong secret with 401", async () => {
    const req = mkReq("POST", "/api/homeassistant/send", { text: "hei" }, "wrong");
    const { res } = mkRes();
    await api.handle(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("send dispatches and publishes token+done to the conversation stream", async () => {
    const events: any[] = [];
    api.hub.subscribe("c1", (e) => events.push(e));
    const req = mkReq("POST", "/api/homeassistant/send", { conversation_id: "c1", text: "hei" });
    const { res } = mkRes();
    await api.handle(req, res);
    await vi.waitFor(() => expect(events.at(-1)).toEqual({ type: "done", full_text: "hei" }));
    expect(events.map((e) => e.type)).toEqual(["token", "token", "done"]);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`pnpm test -- extensions/homeassistant/src/http-api.test.ts`).

- [ ] **Step 3: Implement `createHaHttpApi`** (auth, CORS, JSON parse, routing; `send` and `stream`)

```ts
import type { IncomingMessage, ServerResponse } from "node:http";
import type { StreamHub, HaStreamEvent } from "./stream-hub.js";
import type { HaDispatchFn } from "./channel.js";
import type { ConversationStore } from "./conversations.js";
import type { HaUserIdentity, StoredMessage } from "./protocol.js";

const PREFIX = "/api/homeassistant";

export type HaHttpApiDeps = {
  hub: StreamHub;
  getStore: () => ConversationStore | null;
  getDispatch: () => HaDispatchFn | null;
  getSecret: () => string;
  resolveUser: (body: Record<string, unknown>) => HaUserIdentity;
};

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-openclaw-secret");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}
function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function createHaHttpApi(deps: HaHttpApiDeps) {
  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? "/", "http://x");
    if (!url.pathname.startsWith(PREFIX)) return false;
    cors(res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return true;
    }

    const sub = url.pathname.slice(PREFIX.length);

    if (sub === "/stream" && req.method === "GET") {
      const secret = req.headers["x-openclaw-secret"] ?? url.searchParams.get("secret") ?? "";
      if (secret !== deps.getSecret()) {
        json(res, 401, { error: "unauthorized" });
        return true;
      }
      const convId = url.searchParams.get("conversation_id") ?? "";
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(": connected\n\n");
      const unsub = deps.hub.subscribe(convId, (event: HaStreamEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      const ping = setInterval(() => res.write(": ping\n\n"), 25000);
      req.on("close", () => {
        clearInterval(ping);
        unsub();
      });
      return true;
    }

    // POST endpoints require the secret in the header.
    const body = req.method === "POST" ? await readJson(req) : {};
    const secret = (req.headers["x-openclaw-secret"] as string) ?? (body.secret as string) ?? "";
    if (secret !== deps.getSecret()) {
      json(res, 401, { error: "unauthorized" });
      return true;
    }

    if (sub === "/send" && req.method === "POST") {
      const store = deps.getStore();
      const dispatch = deps.getDispatch();
      if (!store || !dispatch) {
        json(res, 503, { error: "not ready" });
        return true;
      }
      const user = deps.resolveUser(body);
      const text = String(body.text ?? "");
      let convId = body.conversation_id as string | undefined;
      let newConv = false;
      if (!convId) {
        const c = await store.create(user.user_id);
        convId = c.id;
        newConv = true;
      }
      await store.appendMessage(convId, user.user_id, {
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      } as StoredMessage);
      json(res, 200, { conversation_id: convId, new_conversation: newConv });
      // Fire-and-forget dispatch; stream via the hub.
      const id = convId;
      let full = "";
      void (async () => {
        try {
          await dispatch({
            cfg: undefined as never,
            user,
            text,
            conversationId: id,
            onToken: (t) => {
              full += t;
              deps.hub.publish(id, { type: "token", token: t });
            },
            onToolActivity: () => deps.hub.publish(id, { type: "tool" }),
            onDone: (d) => {
              full = d;
              deps.hub.publish(id, { type: "done", full_text: d });
            },
            onError: (e) => deps.hub.publish(id, { type: "error", error: e }),
            signal: new AbortController().signal,
          });
          await store.appendMessage(id, user.user_id, {
            role: "assistant",
            text: full,
            timestamp: new Date().toISOString(),
          } as StoredMessage);
        } catch (e) {
          deps.hub.publish(id, { type: "error", error: String(e) });
        }
      })();
      return true;
    }
    return false; // unhandled → caller may 404
  };
  return { handle, hub: deps.hub };
}
```

> Note: the `cfg` passed to dispatch comes from the live config in Task 5's wiring; the test injects a fake dispatch that ignores it. Keep `getDispatch`/`getStore`/`getSecret` as getters so they read live runtime state.

- [ ] **Step 4: Run → PASS**.
- [ ] **Step 5: Commit** — `scripts/committer "homeassistant: HTTP send + SSE stream API" extensions/homeassistant/src/http-api.ts extensions/homeassistant/src/http-api.test.ts`

---

## Task 4: HTTP API — `conversations` + `transcribe`

**Files:** Modify `extensions/homeassistant/src/http-api.ts` + add tests to `http-api.test.ts`. Port the logic from the deleted `gateway-methods.ts` `handleConversations`/`handleTranscribe` verbatim (it is transport-agnostic) into HTTP handlers.

- [ ] **Step 1: Test** — POST `/api/homeassistant/conversations` `{action:"list", user_id}` returns `{conversations: []}` (store.list mocked); POST `{action:"create"}` returns `{id}`. POST `/api/homeassistant/transcribe` `{audio, mime}` returns `{text}` with a mocked `getTranscribe`.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — add `if (sub === "/conversations" ...)` and `if (sub === "/transcribe" ...)` branches; copy the switch/logic from the old `gateway-methods.ts` (`action` handling, `generateTitle`, transcription via `getTranscribe`). Use `json(res, ...)` for responses.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `scripts/committer "homeassistant: HTTP conversations + transcribe" extensions/homeassistant/src/http-api.ts extensions/homeassistant/src/http-api.test.ts`

---

## Task 5: Wire it into the plugin; remove gateway methods

**Files:** Modify `extensions/homeassistant/index.ts`; create `extensions/homeassistant/src/dispatch.ts` (extract `runHaDispatch`); delete `gateway-methods.ts` + `gateway-methods.test.ts`.

- [ ] **Step 1: Extract dispatch** — move the `setHaDispatch(async ({...}) => {...})` body from `index.ts` into `export async function runHaDispatch(params: Parameters<HaDispatchFn>[0])` in `src/dispatch.ts`. `index.ts` calls `setHaDispatch(runHaDispatch)`. Update the Task 1 smoke test import to `./dispatch.js`.
- [ ] **Step 2: Register routes** — in `registerFull(api)`:

```ts
const hub = new StreamHub();
const haApi = createHaHttpApi({
  hub,
  getStore: () => getConversationStore(),
  getDispatch: () => getHaDispatch(),
  getSecret: () => resolveAccount(api.config as never).secret,
  resolveUser: (body) => {
    /* verify + map, same as old verifyUser */
  },
});
api.registerHttpRoute({
  path: "/api/homeassistant",
  match: { prefix: true }, // confirm match option name in OpenClawPluginHttpRouteMatch
  auth: {
    /* confirm shape; route does its own secret check */
  },
  handler: (req, res) => haApi.handle(req, res),
});
```

Confirm `OpenClawPluginHttpRouteMatch` / `OpenClawPluginHttpRouteAuth` field names in `src/plugins/types.ts` and adjust. Remove the three `api.registerGatewayMethod("homeassistant.*", ...)` calls.

- [ ] **Step 3: Delete** `gateway-methods.ts` + `gateway-methods.test.ts`; delete the temporary `dispatch-smoke.test.ts` (now covered by http-api tests).
- [ ] **Step 4: Typecheck + tests** — `OPENCLAW_LOCAL_CHECK=1 node scripts/run-tsgo.mjs -p tsconfig.extensions.json` (0 errors) and `pnpm test -- extensions/homeassistant` (green).
- [ ] **Step 5: Commit** — `scripts/committer "homeassistant: serve panel via HTTP/SSE; drop gateway methods" extensions/homeassistant/index.ts extensions/homeassistant/src/dispatch.ts extensions/homeassistant/src/http-api.ts`

---

## Task 6: Rewrite the panel transport (keep all UI)

**Files:** Modify the panel JS. Replace only the transport functions; leave render/UI/CSS untouched.

- [ ] **Step 1: Remove WS connect/handshake** — delete `_connectGateway`, the `minProtocol/maxProtocol` handshake, `_connId`, `_scheduleReconnect`/`_showBanner` WS reconnect logic that depended on the socket. Replace connection state with the SSE `EventSource` lifecycle.

- [ ] **Step 2: Add a base URL + secret helper**

```js
this._base = (
  this._config.api_url || this._config.ws_url.replace(/^ws/, "http").replace(/:\d+$/, ":18789")
).replace(/\/$/, "");
this._secret = this._config.secret;
this._api = (path) => this._base + "/api/homeassistant" + path;
this._headers = { "content-type": "application/json", "x-openclaw-secret": this._secret };
```

> Confirm the real HTTP base for the gateway (the panel currently uses `ws_url = wss://…:18790`; the HTTP API is served on the gateway HTTP port `18789`/Tailscale-served). Add `api_url` to the HA component config (`__init__.py` + `config_flow.py`) so it is explicit, defaulting to the gateway origin.

- [ ] **Step 3: `_gwRequest` → fetch**

```js
async _gwRequest(path, body) {
  const res = await fetch(this._api(path), { method: "POST", headers: this._headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
```

Update the conversation calls (`_loadConversations`, `_loadHistory`, `_newConversation`, `_deleteConversation`, rename, transcribe) to `this._gwRequest("/conversations", {...})` / `"/transcribe"`.

- [ ] **Step 4: `_doSend` → POST /send, then ensure the SSE stream is open**

```js
_doSend(text) {
  /* keep: clear welcome, append user bubble + thinking bubble (unchanged) */
  this._ensureStream(this._activeConvId);
  this._gwRequest("/send", { conversation_id: this._activeConvId, text, user_id: this._user.id, user_name: this._user.name })
    .then((r) => { if (r?.new_conversation && r?.conversation_id) { this._switchToNewConv(r.conversation_id); this._ensureStream(r.conversation_id); } })
    .catch((e) => { if (this._streamEl) this._streamEl.innerHTML = "Error: " + escapeHtml(e.message); });
}
```

- [ ] **Step 5: `_ensureStream` (EventSource) replaces `_handleEvent` over WS**

```js
_ensureStream(convId) {
  if (this._es && this._esConv === convId) return;
  if (this._es) this._es.close();
  this._esConv = convId;
  const url = this._api("/stream") + "?conversation_id=" + encodeURIComponent(convId) + "&secret=" + encodeURIComponent(this._secret);
  this._es = new EventSource(url);
  this._es.onopen = () => this._setConn("connected");
  this._es.onerror = () => this._setConn("connecting"); // EventSource auto-reconnects
  this._es.onmessage = (ev) => {
    const e = JSON.parse(ev.data);
    if (e.type === "token") this._onToken(e.token);
    else if (e.type === "tool") { if (this._thinkingEl) this._thinkingEl.textContent = "Running a tool…"; }
    else if (e.type === "done") this._onDone(e.full_text);
    else if (e.type === "error") this._onError(e.error);
    else if (e.type === "title") this._onTitle(e.title);
  };
}
```

Extract the existing token/done/error/title render logic from the old `_handleEvent` into `_onToken/_onDone/_onError/_onTitle` (same bodies). `_setConn(state)` updates the existing `.conn-status` class/text and shows/hides the banner.

- [ ] **Step 6: Open the stream on load** — after `_loadConversations()` (which now just fetches the list), call `_ensureStream(this._activeConvId)` for the default/new chat.

- [ ] **Step 7: `disconnectedCallback`** — `if (this._es) this._es.close();` plus the existing viewport-listener cleanup.

- [ ] **Step 8: Syntax check** — `node --check <panel.js>`. Expected: OK.

- [ ] **Step 9: Commit** — `scripts/committer "homeassistant(panel): transport via fetch + EventSource" <panel.js> extensions/homeassistant/ha-component/custom_components/openclaw/__init__.py extensions/homeassistant/ha-component/custom_components/openclaw/config_flow.py`

---

## Task 7: Rigid verification — backend + frontend (acceptance gate)

This is the **gate before deploy**. It runs against a scratch gateway in the worktree (isolated home, non-production port) so the live home is never touched. Every step captures evidence. **Do not proceed to Task 8 until both 7A and 7B are fully green.** Build the two harnesses as reusable files — Task 8 reruns them against the live system.

**Files:** Create `extensions/homeassistant/scripts/verify-backend.sh` and `extensions/homeassistant/scripts/verify-frontend.mjs`.

### 7A — Backend

- [ ] **Step 1: Static gates** — `OPENCLAW_LOCAL_CHECK=1 node scripts/run-tsgo.mjs -p tsconfig.extensions.json` (0 errors); `npx oxlint -c .oxlintrc.json --tsconfig config/tsconfig/oxlint.extensions.json extensions/homeassistant` (0 errors); `pnpm test -- extensions/homeassistant` (all green: `stream-hub`, `http-api`). Capture each exit code.
- [ ] **Step 2: Scratch gateway** — start with the registered Anthropic profile but an isolated state dir if feasible: `OPENCLAW_GATEWAY_PORT=18999 openclaw gateway run --bind loopback --port 18999 > /tmp/ha-verify-gw.log 2>&1 &`. Wait for `[gateway] ready`; assert no `missing bundled-channel-entry contract` warning in the log.
- [ ] **Step 3: Auth** — `send` with no secret and with a wrong secret → **HTTP 401**; with the correct secret → 200. Assert all three codes.
- [ ] **Step 4: Real round-trip (not mocked)** — `POST /send {text:"hei"}` → `{conversation_id}`; then `curl -N .../stream?conversation_id=<id>&secret=<S>`. Expected: SSE prints one or more `data:{"type":"token",...}` frames from a **real model reply**, then `data:{"type":"done",...}`. This proves auth→model→in-process dispatch→stream end to end.
- [ ] **Step 5: Endpoints** — `conversations` create→list→load→rename→delete (assert JSON each); `transcribe` with a tiny sample wav → `{text}`.
- [ ] **Step 6: SSE cleanup** — open a `/stream`, drop the client (close curl), restart the scratch gateway → a fresh `/stream` works; no subscriber leak (a second send still streams).
- [ ] **Step 7: Save + commit** `verify-backend.sh` (prints PASS/FAIL per step, non-zero exit on any failure). `scripts/committer "homeassistant: backend verification harness" extensions/homeassistant/scripts/verify-backend.sh`

### 7B — Frontend (browser-driven, real reply)

- [ ] **Step 1: `verify-frontend.mjs`** (Playwright, auth via the HA long-lived token in `localStorage` as in `.ha-panel-shot.mjs`) loads the panel at **three viewports** — desktop 1280×800, iPad 834×1112, iPhone 390×844. For each: wait for `.conn-status.connected`, screenshot `/tmp/ha-verify-<vp>.png`. Assert all three reach connected.
- [ ] **Step 2: Send + stream render** — fill `.input-textarea` with "hei", press Enter; poll `.msg-row.assistant .msg-bubble` until it holds a real reply (not `Tenker…`/empty). Assert the user bubble is right-aligned and the assistant left. Screenshot `/tmp/ha-verify-reply.png`.
- [ ] **Step 3: Suggestion chip + tool indicator** — new chat → click the read-only chip "Hvilke lys er på?" → assert a reply renders, and that "Running a tool…" appeared on `.thinking-text` during the run.
- [ ] **Step 4: History** — open the sidebar (`.hamburger-btn`), assert `.conv-title` values match `^\d{2}\.[A-Za-z]{3}: ` (the `dd.Mon:` format), click a second `.conv-info` → its messages load.
- [ ] **Step 5: Reconnect** — kill the scratch gateway ~5s → assert the panel shows a disconnected/reconnecting indicator, then returns to `connected` after restart (EventSource auto-reconnect). Screenshot the banner.
- [ ] **Step 6: Welcome state** — a fresh chat shows the greeting + chips. Screenshot `/tmp/ha-verify-welcome.png`.
- [ ] **Step 7: Gate + commit** — all assertions pass and 5 screenshots captured (3 viewports + reply + welcome). `scripts/committer "homeassistant: frontend verification harness" extensions/homeassistant/scripts/verify-frontend.mjs`. **Both 7A and 7B green → proceed to Task 8.**

---

## Task 8: Deploy once, with rollback

- [ ] **Step 1: Back up live** — `cp` the live panel + `__init__.py` to `*.bak-<ts>` (already have a panel backup; refresh it).
- [ ] **Step 2: Merge** `ha-bridge-rebuild` → `main` (the repo the live gateway runs from). `pnpm install` is NOT needed (no dep changes); if any, run it with the gateway stopped.
- [ ] **Step 3: Deploy panel** — copy the new panel + `__init__.py` (with bumped `?v=`) into `~/dev/project_jarvis/homeassistant/custom_components/openclaw/`.
- [ ] **Step 4: Restart** — `openclaw gateway stop` → (only if deps changed: build) → `openclaw gateway restart`; then `docker restart homeassistant` to re-register the panel.
- [ ] **Step 5: Re-run the rigid verification LIVE** — run `verify-backend.sh` and `verify-frontend.mjs` (from Task 7) against the **live** gateway/HA (live port, live origin). All steps must pass: static gates already green; live auth 401s; live real send→stream→done; conversations/transcribe; all 3 viewports connected + reply rendered + reconnect. Then a human phone check: open the panel, send a message, confirm a real reply. Do not consider deploy complete until the live verification is green.
- [ ] **Step 6: Rollback path** — if broken: restore the `*.bak` panel + `git checkout` the prior `main` + `openclaw gateway restart`.

---

## Self-review notes

- Spec coverage: send/stream/conversations/transcribe (Tasks 3–4), in-process dispatch + channel contract (Tasks 1,5), panel transport (Task 6), offline testing (Task 7), deploy/rollback (Task 8), branch isolation (Task 0). ✅
- Open confirmations flagged inline (not placeholders): `OpenClawPluginHttpRouteMatch`/`Auth` field names (Task 5), the gateway HTTP base URL/port for the panel (Task 6 Step 2). Resolve by reading `src/plugins/types.ts` and the gateway HTTP server config during execution.
- Types consistent: `HaStreamEvent`, `createHaHttpApi`, `HaHttpApiDeps`, `runHaDispatch`, `StreamHub.subscribe/publish` used identically across tasks.
