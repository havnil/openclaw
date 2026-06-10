# Home Assistant panel — bridge rebuild design

- **Date:** 2026-06-10
- **Status:** Approved (design); pending implementation plan
- **Scope:** Rebuild only the panel↔gateway _transport_ and channel registration. Keep the existing UI/UX, HA tools, conversation store, and voice transcription.

## Problem

The HA sidebar panel talks **directly to the gateway's internal control protocol** (connect handshake, protocol version, event namespaces). That protocol is meant to evolve, so the panel breaks on every gateway upgrade. Upgrading the gateway from `2026.3.30` → `2026.6.2` surfaced a cascade of breakages: `@sinclair/typebox` rename, protocol `3 → 4`, the `plugin.*` event-scope guard, the `bundled-channel-entry` registration contract, and the legacy auth-profiles store. Each fix revealed the next — the architecture, not the code quality, is the issue.

## Goal

A Home Assistant sidebar chat that:

1. Works on current OpenClaw (`2026.6.2`).
2. **Survives future gateway upgrades** — the panel should not need changes when the gateway's wire protocol changes.
3. Preserves today's UX: the new "Warm Slate" look, welcome screen + suggestion chips, streaming replies, tool indicator, voice input, conversation history.

## Chosen architecture — decouple via a stable, plugin-owned API

```
  HA panel ──fetch + Server-Sent Events (web standards, plugin-owned)──► plugin HTTP API ──in-process──► agent
            (no gateway wire protocol, no handshake, no protocol version)
```

The panel depends only on `fetch` + `EventSource` (web standards that do not change). The gateway wire protocol is removed from the panel entirely. All OpenClaw/SDK volatility is isolated to one small, testable, server-side adapter.

### Components

1. **Panel (browser, served by HA)** — the existing restyled UI. Transport swapped from gateway WebSocket to plain `fetch` + `EventSource`. Knows nothing about OpenClaw internals. The hand-rolled reconnect logic is dropped (EventSource auto-reconnects).
2. **Plugin HTTP API** (`api.registerHttpRoute`) — a small, stable surface the plugin owns:
   - `POST  /api/homeassistant/send` — `{conversation_id?, text}` → dispatches in-process; returns conversation id immediately.
   - `GET   /api/homeassistant/stream?conversation_id=…` — SSE stream of `token` / `tool` / `done` / `error` / `title` events for that conversation.
   - `GET/POST /api/homeassistant/conversations` — list / create / load / delete / rename (existing store).
   - `POST  /api/homeassistant/transcribe` — voice (existing media-understanding).
   - **Auth:** existing shared secret in an `Authorization`/`X-OpenClaw-Secret` header.
3. **In-process dispatch (server)** — the existing `setHaDispatch` logic (`createChannelReplyPipeline` + `dispatchInboundMessage`), updated to the `2026.6.2` reply-runtime. The **only** part that touches the SDK.
4. **Channel registration** — conformed to the current `bundled-channel-entry` contract (`src/channels/plugins/bundled.ts`) so the channel + `ha_*` tools register cleanly.

### Data flow

1. User sends → panel `POST /send`.
2. Plugin dispatches to the agent in-process; as the reply streams, it emits SSE events on that conversation's stream.
3. Panel's `EventSource` receives `token`/`tool`/`done` → renders (same UX as today).

### Error handling

- SSE connection state drives the panel's connection indicator; `EventSource` auto-reconnects.
- HTTP errors return clear status codes; the panel surfaces them.
- CORS headers on the plugin routes allow the HA origin.

### Testing

- The HTTP API is fully testable with plain HTTP requests — **send→stream→done verified offline**, no browser, before any deploy.
- Dispatch unit-tested (extend the existing `gateway-methods.test.ts` pattern).

## To verify during planning

- `registerHttpRoute` supports long-lived **SSE** streaming (raw response access). If not, fall back to short-poll (`GET /stream` returns buffered new events) — same panel API, slightly less elegant.
- CORS specifics for the HA origin.

## Non-goals

- No change to the visual design (the restyle stays).
- Not adopting `bindings` for per-user routing (separate, optional, later).
- Not rebuilding the HA tools or conversation store (they're fine).

## Safety

- Build on a branch/worktree; do not disrupt the running gateway mid-build.
- Current production panel is backed up; deploy once, with rollback ready.
