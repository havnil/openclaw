# Home Assistant Auto-Memory — Design

**Status:** Approved design (brainstorm). Next: implementation plan.
**Date:** 2026-06-18
**Scope:** v1 = per-person memory (capture + recall + proactive suggestions). v2 (future) = shared household layer.

## Goal

The HA assistant should automatically remember significant info from each person's
conversations — preferences, recipes, personal facts, standing instructions, recurring
concerns, media/playlists — and proactively use it in their future chats (e.g. Nora asks
for music → assistant suggests playlists she's enjoyed before). Memory is **per person**,
isolated between household members, and capture is **visibly confirmed** in-chat.

## Background — what already exists, and the bug we fix

OpenClaw already has the memory machinery; we reuse it rather than build new storage:

- **memory-core** (`extensions/memory-core/`): per-agent Markdown memory (`MEMORY.md` +
  dated `memory/*.md`) indexed into a per-agent SQLite store; read tools `memory_search` /
  `memory_get`; "dreaming" promotes useful recalls into `MEMORY.md`. Memory is keyed by
  `(agentId, resolveAgentWorkspaceDir(cfg, agentId))` — i.e. **one store per agent**.
- **active-memory** (`extensions/active-memory/`): a pre-reply recall sub-agent that
  searches memory and injects relevant snippets into the chat. Opt-in per agent via
  `plugins.entries.active-memory.config.agents` (currently `["main"]`).
- **Write paths** today: compaction "memory flush", the `/new`/`/reset` session dump, and
  background dreaming. There is **no** mid-conversation, significance-based capture tool.

**Latent bug we fix as a side effect:** `extensions/homeassistant/src/dispatch.ts` computes
`agentId = is_admin ? "main" : "home"` but that value never reaches the run — the run agent
comes from `ctx.AgentId` (unset here) → falls back to the default `main`. So **today every HA
user shares the single `main` memory**. Per-person memory therefore also closes a real
privacy gap.

## Architecture — per-user agents (Approach 1)

Give **each HA person their own agent**, so OpenClaw's existing per-agent isolation makes
their memory private and personalized for free — no changes to the shared memory index.

- **Identity = `hass.user.id`** (a stable 32-hex id per HA account; verified present on disk,
  e.g. `e1beb36…`). The panel already sends it as `user_id`. Same account on phone + tablet =
  same id = one memory. The household kiosk/tablet is logged in as the owner, so it routes to
  the owner's `main` memory — no cross-person merging. Each other person uses their own HA login
  on their own device.
- **Routing:** HA dispatch sets `ctx.AgentId`:
  - admin (the owner) → `main` (HA chats enrich the owner's unified cross-channel assistant)
  - everyone else → `home-<normalizedHassUserId>` (auto-provisioned on first message:
    workspace, memory index, `MEMORY.md` all created lazily; `agents.defaults` apply).
- **Why not partition inside one shared agent (rejected):** memory-core's search has no
  owner/path filter; per-user isolation would require new SQL + tool params in a shared
  cross-user index — high privacy blast radius (one filter bug leaks a person's data).
  Per-agent isolation is hard, total, and already implemented.

## Components

### 1. Routing & identity (`extensions/homeassistant`)

- In the inbound→run path, set `ctx.AgentId` from the resolved HA user:
  `is_admin ? "main" : "home-" + normalizeAgentId(user.user_id)`.
- `normalizeAgentId` (`src/routing/session-key.ts`) already sanitizes any string to a safe
  `[a-z0-9_-]{1,64}` id; arbitrary ids dispatch and auto-provision (no agent registry gate).
- Keep the existing `is_admin` derivation (admins config) unchanged.

### 2. `remember` tool (new, narrow, plugin-owned)

- Signature: `remember({ fact: string, category?: "preference"|"recipe"|"fact"|"instruction"|"concern"|"media" })`.
- Behavior: append one distilled line to the **running agent's** memory under
  `memory/YYYY-MM-DD.md` (append-only; same convention as flush/session hooks), tagged with
  category + date, so memory-core indexes it and dreaming can promote it to `MEMORY.md`.
- No user key needed — routing already put the run on the person's own agent, so "the current
  agent" _is_ the user. The tool resolves the current run's agent workspace
  (`resolveAgentWorkspaceDir(cfg, runAgentId)`).
- Returns the saved line so the model can acknowledge accurately.
- Added to the HA agents' tool allowlist (the messaging tool profile strips the generic
  `write`/memory tools; this one narrow tool replaces that capability).

### 3. Recall & proactive suggestions

- Enable **active-memory** for the HA agents so relevant memories are injected pre-reply
  (the reliable path for proactive suggestions).
- Per-user agent ids aren't known in advance, so make one **small, backward-compatible**
  change to active-memory: allow `config.agents` entries to match by prefix/glob (e.g.
  `home-*`). Then configure `["main", "home-*"]`. A literal `home-*` matches no agent today,
  so the change is additive.

### 4. Prompt guidance (capture + suggestion behavior)

Delivered as a system-prompt addition on HA runs (exact mechanism — bootstrap template vs. a
plugin prompt contribution — chosen in the plan). Content:

- **Capture (liberal):** when the user shares a durable preference, recipe, personal fact,
  standing instruction, recurring concern, or media/playlist they want, call `remember(...)`
  then briefly acknowledge ("Got it — I'll remember you're vegetarian"). Err toward capturing;
  visible confirmation lets the user correct.
- **Do not capture:** transient commands ("turn on the light"), already-known facts.
- **Corrections:** if the user says it's wrong, record a correcting entry (memory is
  append-only; recall favors the latest; dreaming reconciles). Hard delete is v2.
- **Suggest:** when relevant, proactively surface what you remember (recipes they liked,
  playlists they've enjoyed, prior concerns).

## Data flow

1. HA message arrives → dispatch resolves the HA user → sets `ctx.AgentId` (per person).
2. Run starts on that person's agent. active-memory injects relevant prior memories.
3. Agent replies; if durable info appeared, it calls `remember(...)` (writes to this person's
   `memory/YYYY-MM-DD.md`) and acknowledges in the reply.
4. memory-core indexes the new line; future runs recall it; dreaming promotes durable items
   into `MEMORY.md`.

## Out of scope (v1)

- **Shared household layer (v2):** built on the per-person baseline via **periodic extraction**
  — a scheduled job promotes selected knowledge from individual stores (e.g. Nora's) into a
  shared `household` store (analogous to dreaming's promotion), rather than live cross-agent
  recall. Per-person stores stay the source of truth. Deferred deliberately. (v1 keeps the
  per-person memory format clean enough to extract from later.)
- **Hard memory delete tool (v2):** v1 corrects via append + reconciliation.

## Error handling & edge cases

- `remember` write failure → tool returns an error; the agent should not claim it saved.
- Unknown/blank `user_id` → routing falls back to a single shared `home-anonymous` agent
  (no crash); flagged in logs.
- Concurrent appends to one person's daily file → append-only mitigates; the existing memory
  write conventions tolerate it.
- A new person's first message provisions their agent lazily (first reply may be marginally
  slower); acceptable.

## Testing & verification

- **Unit:** routing derives the correct `agentId` per HA user (admin→`main`, others→
  `home-<id>`); `remember` writes the expected file path + line format; active-memory prefix
  matching (`home-*` matches `home-abc`, not `main`).
- **Live (real behavior proof):** with two HA identities, show **isolation** (person A's fact
  never appears in person B's recall), **visible capture** (fact → ack), and **recall/suggestion**
  in a later chat. Per-person agent dirs/indexes appear under `agents/`.

## Open items to resolve in the plan

- Exact hook point to set `ctx.AgentId` in the HA inbound→run path.
- How the `remember` tool obtains the current run's `agentId`/workspace at execute time.
- Prompt-delivery mechanism (shared bootstrap snippet vs. plugin prompt contribution) so every
  per-user agent gets the capture/suggestion guidance without per-agent hand editing.
- active-memory prefix-matching change: smallest additive edit + a lock test.
