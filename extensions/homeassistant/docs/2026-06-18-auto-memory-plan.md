# HA Auto-Memory (v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each Home Assistant person their own isolated, auto-built memory — capture durable facts mid-conversation (visibly confirmed) and proactively recall/suggest them in future chats.

**Architecture:** Route each HA user to their own agent via `ctx.AgentId` (admin → `main`, others → `home-<hassUserId>`), reusing OpenClaw's per-agent memory isolation for free. Add a narrow `remember` tool that appends to the running agent's `memory/YYYY-MM-DD.md`. Enable the `active-memory` plugin (with an additive `home-*` prefix match) for proactive recall, and inject capture/suggestion guidance into HA runs via the `before_prompt_build` hook.

**Tech Stack:** TypeScript ESM, Vitest, OpenClaw plugin SDK (`openclaw/plugin-sdk/*`), typebox tool schemas.

**Design spec:** `extensions/homeassistant/docs/2026-06-18-auto-memory-design.md`

**Working location:** the main checkout `/Users/admin/dev/openclaw` (the live gateway runs this repo's `dist/`). Not a worktree. pnpm is healthy, so `pnpm test <path>` works; build/deploy per Task 6.

---

## File structure

| File                                                   | Responsibility                                                  | Change                         |
| ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------ |
| `extensions/homeassistant/src/agent-routing.ts`        | Pure: map an HA user → agentId                                  | **create**                     |
| `extensions/homeassistant/src/agent-routing.test.ts`   | Test routing                                                    | **create**                     |
| `extensions/homeassistant/src/dispatch.ts`             | Set `ctx.AgentId` from the user                                 | modify (~line 12, ~line 14-29) |
| `extensions/homeassistant/src/remember.ts`             | Pure: format + append a memory line; date stamp                 | **create**                     |
| `extensions/homeassistant/src/remember.test.ts`        | Test format/append/date                                         | **create**                     |
| `extensions/homeassistant/src/memory-guidance.ts`      | Capture/suggestion prompt text + HA-run predicate               | **create**                     |
| `extensions/homeassistant/src/memory-guidance.test.ts` | Test predicate                                                  | **create**                     |
| `extensions/homeassistant/index.ts`                    | Register `remember` tool (factory) + `before_prompt_build` hook | modify (`registerFull`)        |
| `extensions/homeassistant/openclaw.plugin.json`        | Add `remember` to `contracts.tools`                             | modify                         |
| `extensions/active-memory/index.ts`                    | Prefix-match agent allowlist (`home-*`)                         | modify (~line 1099-1110)       |
| `extensions/active-memory/index.test.ts`               | Lock prefix match                                               | modify                         |
| live `~/.openclaw/openclaw.json`                       | Enable active-memory for `main`,`home-*`; allow `remember`      | Task 6 (deploy)                |

---

### Task 1: Per-user agent routing

**Files:**

- Create: `extensions/homeassistant/src/agent-routing.ts`
- Create: `extensions/homeassistant/src/agent-routing.test.ts`
- Modify: `extensions/homeassistant/src/dispatch.ts` (line 12; the `finalizeInboundContext({...})` object at lines 14-29)

Context: `dispatch.ts:12` computes `const agentId = user.is_admin ? "main" : "home"` but never puts it on the inbound context, so every HA user currently runs as the default `main`. The run agent is read from `ctx.AgentId` (`src/auto-reply/reply/dispatch-from-config.ts:369`), a known `MsgContext` field (`src/auto-reply/templating.ts:112`) preserved by `finalizeInboundContext`. `normalizeAgentId` is exported from `openclaw/plugin-sdk/routing` and returns `"main"` for empty input.

- [ ] **Step 1: Write the failing test**

```ts
// extensions/homeassistant/src/agent-routing.test.ts
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test extensions/homeassistant/src/agent-routing.test.ts`
Expected: FAIL — cannot resolve `./agent-routing.js`.

- [ ] **Step 3: Implement**

```ts
// extensions/homeassistant/src/agent-routing.ts
import { normalizeAgentId } from "openclaw/plugin-sdk/routing";
import type { HaUserIdentity } from "./protocol.js";

/**
 * Map an HA user to the agent whose memory their chat uses. Admin (owner) → "main"
 * (unified cross-channel assistant); everyone else → "home-<normalized hass user id>"
 * so each person gets an isolated, auto-provisioned memory store.
 */
export function resolveHaAgentId(user: HaUserIdentity): string {
  if (user.is_admin) {
    return "main";
  }
  return `home-${normalizeAgentId(user.user_id || "anonymous")}`;
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test extensions/homeassistant/src/agent-routing.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire it into dispatch**

In `extensions/homeassistant/src/dispatch.ts`: add the import near the other local imports:

```ts
import { resolveHaAgentId } from "./agent-routing.js";
```

Replace line 12:

```ts
const agentId = resolveHaAgentId(user);
```

Add `AgentId: agentId,` into the `finalizeInboundContext({ ... })` object (next to `Provider`/`Surface`):

```ts
    Provider: "homeassistant" as const,
    Surface: "homeassistant" as const,
    AgentId: agentId,
```

- [ ] **Step 6: Typecheck + full plugin tests**

Run: `OPENCLAW_LOCAL_CHECK=1 node scripts/run-tsgo.mjs -p tsconfig.extensions.json` (expect no `error TS`)
Run: `pnpm test extensions/homeassistant` (expect all pass)

- [ ] **Step 7: Commit**

```bash
scripts/committer "homeassistant: route each HA user to their own agent via ctx.AgentId" \
  extensions/homeassistant/src/agent-routing.ts \
  extensions/homeassistant/src/agent-routing.test.ts \
  extensions/homeassistant/src/dispatch.ts
```

---

### Task 2: `remember` write helper (pure)

**Files:**

- Create: `extensions/homeassistant/src/remember.ts`
- Create: `extensions/homeassistant/src/remember.test.ts`

Context: memory-core indexes any `*.md` under `<workspace>/memory/` (`packages/memory-host-sdk/src/host/internal.ts:114-183`). The flush convention is the canonical, append-only daily file `memory/YYYY-MM-DD.md` (`extensions/memory-core/src/flush-plan.ts:15-34,122-123`). Keep these as pure functions so they're testable without a running agent.

- [ ] **Step 1: Write the failing test**

```ts
// extensions/homeassistant/src/remember.test.ts
import { describe, it, expect } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test extensions/homeassistant/src/remember.test.ts`
Expected: FAIL — cannot resolve `./remember.js`.

- [ ] **Step 3: Implement**

```ts
// extensions/homeassistant/src/remember.ts
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/** Format one appendable memory bullet for memory/YYYY-MM-DD.md. */
export function formatMemoryLine(params: { fact: string; category?: string }): string {
  const fact = params.fact.trim();
  const category = params.category?.trim();
  const tag = category ? ` _(${category})_` : "";
  return `- ${fact}${tag}\n`;
}

/** YYYY-MM-DD in local time (intuitive for a home user; matches the daily-file convention). */
export function localDateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Append a distilled memory line to <workspaceDir>/memory/<dateStamp>.md (append-only,
 * canonical daily filename). memory-core auto-indexes any *.md under memory/. Returns the
 * written line (without trailing newline) so the caller can acknowledge it.
 */
export async function appendMemoryLine(params: {
  workspaceDir: string;
  dateStamp: string;
  fact: string;
  category?: string;
}): Promise<string> {
  const memoryDir = join(params.workspaceDir, "memory");
  await mkdir(memoryDir, { recursive: true });
  const line = formatMemoryLine({ fact: params.fact, category: params.category });
  await appendFile(join(memoryDir, `${params.dateStamp}.md`), line, "utf-8");
  return line.trimEnd();
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test extensions/homeassistant/src/remember.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
scripts/committer "homeassistant: add remember write helper (append distilled fact to daily memory)" \
  extensions/homeassistant/src/remember.ts \
  extensions/homeassistant/src/remember.test.ts
```

---

### Task 3: Register the `remember` tool (factory) + manifest

**Files:**

- Modify: `extensions/homeassistant/index.ts` (`registerFull`)
- Modify: `extensions/homeassistant/openclaw.plugin.json` (`contracts.tools`)

Context: register as a **factory** `(ctx) => tool` so it captures the run's agent (`ctx.agentId`/`ctx.workspaceDir`/`ctx.getRuntimeConfig`) — the canonical memory-core pattern (`extensions/memory-core/index.ts:200-206`, ctx type `src/plugins/tool-types.ts:15-53`). Because routing (Task 1) already put the run on the person's agent, "the current agent" is the user. Existing HA tools return `{ content: [{type:"text", text}], details: {} }`. Use a flat `Type.String` for `category` (providers can reject `anyOf`/unions). The manifest needs `remember` in `contracts.tools` or registration is rejected (same gate that blocked the `ha_*` tools before).

- [ ] **Step 1: Add imports at the top of `index.ts`**

```ts
import type { OpenClawConfig } from "openclaw/plugin-sdk/account-resolution";
import { resolveAgentWorkspaceDir } from "openclaw/plugin-sdk/agent-runtime";
import { appendMemoryLine, localDateStamp } from "./src/remember.js";
```

(`OpenClawConfig` may already be imported — do not duplicate.)

- [ ] **Step 2: Register the tool inside `registerFull`, after the existing `api.registerTool(...)` calls**

```ts
// ── remember: durable per-user memory capture (writes to the running agent's memory) ──
api.registerTool(
  (toolCtx) => ({
    name: "remember",
    label: "Remember",
    description:
      "Save a durable fact about the current user to long-term memory: a preference, recipe, " +
      "personal fact, standing instruction, recurring concern, or media/playlist they like. " +
      "Call this when the user shares something worth remembering, then briefly acknowledge it.",
    parameters: Type.Object({
      fact: Type.String({ description: "The distilled fact to remember, one sentence." }),
      category: Type.Optional(
        Type.String({
          description: "Optional tag: preference, recipe, fact, instruction, concern, or media.",
        }),
      ),
    }),
    async execute(_id, params) {
      const { fact, category } = params as { fact: string; category?: string };
      if (!fact?.trim()) {
        return { content: [{ type: "text" as const, text: "No fact provided." }], details: {} };
      }
      const cfg = (toolCtx.getRuntimeConfig?.() ?? toolCtx.runtimeConfig ?? toolCtx.config) as
        | OpenClawConfig
        | undefined;
      const workspaceDir =
        toolCtx.workspaceDir ??
        (cfg ? resolveAgentWorkspaceDir(cfg, toolCtx.agentId ?? "main") : undefined);
      if (!workspaceDir) {
        return {
          content: [{ type: "text" as const, text: "Could not resolve memory location." }],
          details: {},
        };
      }
      const line = await appendMemoryLine({
        workspaceDir,
        dateStamp: localDateStamp(new Date()),
        fact,
        category,
      });
      return { content: [{ type: "text" as const, text: `Remembered: ${line}` }], details: {} };
    },
  }),
  { names: ["remember"] },
);
```

- [ ] **Step 3: Add `remember` to the manifest `contracts.tools`**

In `extensions/homeassistant/openclaw.plugin.json`, change:

```json
  "contracts": {
    "tools": ["ha_get_states", "ha_call_service", "ha_get_history", "ha_fire_event"]
  },
```

to include `"remember"`:

```json
  "contracts": {
    "tools": ["ha_get_states", "ha_call_service", "ha_get_history", "ha_fire_event", "remember"]
  },
```

- [ ] **Step 4: Typecheck**

Run: `OPENCLAW_LOCAL_CHECK=1 node scripts/run-tsgo.mjs -p tsconfig.extensions.json`
Expected: no `error TS`. (If `registerTool` rejects the factory form's type, confirm the factory overload signature at `src/plugins/types.ts:2626` and the `OpenClawPluginToolContext` import — `ctx.workspaceDir`/`ctx.agentId`/`ctx.getRuntimeConfig` are the fields used.)

- [ ] **Step 5: Commit**

```bash
scripts/committer "homeassistant: register remember tool (per-user durable memory capture)" \
  extensions/homeassistant/index.ts \
  extensions/homeassistant/openclaw.plugin.json
```

---

### Task 4: active-memory `home-*` prefix matching

**Files:**

- Modify: `extensions/active-memory/index.ts` (`isEnabledForAgent`, ~lines 1099-1110)
- Modify: `extensions/active-memory/index.test.ts`

Context: the allowlist gate is `return config.agents.includes(agentId);` (`index.ts:1109`). Per-user agent ids (`home-<id>`) aren't known in advance; support a trailing-`*` prefix so `["main","home-*"]` covers everyone. The `agents` config schema is `array<string>` (no constraint), so **no manifest schema change** is needed. The negative test at `index.test.ts:787` ("does not run for agents that are not explicitly targeted") is the mirror to copy.

- [ ] **Step 1: Add the failing lock test** in `extensions/active-memory/index.test.ts`, mirroring the structure of the test at line ~787 but asserting a `home-*` entry matches a `home-<id>` agent and does NOT match `main`. Use the same harness (mock `api`, drive `hooks.before_prompt_build`, assert `runEmbeddedAgent` is/ isn't called). Concretely add:

```ts
it("matches per-user agents via a home-* prefix entry", async () => {
  // config.agents: ["home-*"]; agentId "home-abc" → active-memory runs; "main" → does not.
  // (Build the harness exactly like the line ~787 test, setting pluginConfig.agents = ["home-*"].)
});
```

Fill the body by copying the line ~787 test and changing `agents` to `["home-*"]`, running once with agentId `"home-abc"` (expect `runEmbeddedAgent` called) and once with `"main"` (expect not called).

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test extensions/active-memory/index.test.ts`
Expected: FAIL — `home-*` does not match `home-abc` under exact `includes`.

- [ ] **Step 3: Implement the prefix match**

In `extensions/active-memory/index.ts`, add above `isEnabledForAgent`:

```ts
/** Allowlist entry matching: a trailing "*" is a prefix (e.g. "home-*" matches "home-abc"). */
function agentMatchesAllowlist(agents: string[], agentId: string): boolean {
  return agents.some((entry) =>
    entry.endsWith("*") ? agentId.startsWith(entry.slice(0, -1)) : entry === agentId,
  );
}
```

Change line 1109 from:

```ts
return config.agents.includes(agentId);
```

to:

```ts
return agentMatchesAllowlist(config.agents, agentId);
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test extensions/active-memory/index.test.ts`
Expected: PASS (including the existing exact-match tests — `"main"` entry still matches only `main`).

- [ ] **Step 5: Commit**

```bash
scripts/committer "active-memory: support trailing-* prefix in agent allowlist (home-*)" \
  extensions/active-memory/index.ts \
  extensions/active-memory/index.test.ts
```

---

### Task 5: HA capture/suggestion prompt guidance via `before_prompt_build`

**Files:**

- Create: `extensions/homeassistant/src/memory-guidance.ts`
- Create: `extensions/homeassistant/src/memory-guidance.test.ts`
- Modify: `extensions/homeassistant/index.ts` (`registerFull`)

Context: the `before_prompt_build` hook returns `{ prependContext: string }` to inject text into the prompt (`extensions/active-memory/index.ts:3101-3103`). Scope to HA runs via `ctx.messageProvider === "homeassistant"` (active-memory reads `ctx.messageProvider` at `index.ts:3062`) so the owner's `main` agent only gets this guidance on HA chats, not WhatsApp.

- [ ] **Step 1: Write the failing test**

```ts
// extensions/homeassistant/src/memory-guidance.test.ts
import { describe, it, expect } from "vitest";
import { HA_MEMORY_GUIDANCE, shouldInjectHaGuidance } from "./memory-guidance.js";

describe("shouldInjectHaGuidance", () => {
  it("injects for homeassistant runs", () => {
    expect(shouldInjectHaGuidance({ messageProvider: "homeassistant" })).toBe(true);
  });
  it("does not inject for other channels", () => {
    expect(shouldInjectHaGuidance({ messageProvider: "whatsapp" })).toBe(false);
    expect(shouldInjectHaGuidance({})).toBe(false);
  });
});

describe("HA_MEMORY_GUIDANCE", () => {
  it("mentions the remember tool and proactive suggestions", () => {
    expect(HA_MEMORY_GUIDANCE).toContain("remember");
    expect(HA_MEMORY_GUIDANCE.toLowerCase()).toContain("suggest");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test extensions/homeassistant/src/memory-guidance.test.ts`
Expected: FAIL — cannot resolve `./memory-guidance.js`.

- [ ] **Step 3: Implement**

```ts
// extensions/homeassistant/src/memory-guidance.ts

/** Capture + suggestion guidance injected into Home Assistant agent runs. */
export const HA_MEMORY_GUIDANCE = [
  "## Remembering & suggesting (Home Assistant)",
  "",
  "When the user shares something durable — a preference, recipe, personal fact, standing",
  "instruction, recurring concern, or music/playlist they want — call the `remember` tool with",
  'a one-sentence distilled fact, then briefly acknowledge it (e.g. "Got it — I\'ll remember that").',
  "Be liberal: if unsure whether something is worth keeping, remember it. Do not remember transient",
  'commands ("turn on the light") or things you already know. If the user corrects a remembered fact,',
  "call `remember` again with the correction.",
  "",
  "Proactively use what you remember: when relevant, suggest recipes they've liked, playlists they've",
  "enjoyed, or revisit prior concerns — without being asked.",
].join("\n");

/** HA runs are identified by the homeassistant message provider. */
export function shouldInjectHaGuidance(ctx: { messageProvider?: string }): boolean {
  return ctx.messageProvider === "homeassistant";
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `pnpm test extensions/homeassistant/src/memory-guidance.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Register the hook in `registerFull`** (`extensions/homeassistant/index.ts`)

Add the import:

```ts
import { HA_MEMORY_GUIDANCE, shouldInjectHaGuidance } from "./src/memory-guidance.js";
```

Add inside `registerFull`:

```ts
// Inject capture/suggestion guidance into HA agent runs (uniform across main + home-* agents).
api.on("before_prompt_build", (_event, ctx) =>
  shouldInjectHaGuidance(ctx) ? { prependContext: HA_MEMORY_GUIDANCE } : undefined,
);
```

If `api.on` is not present on the plugin api type, use the equivalent `api.registerHook("before_prompt_build", ...)` (confirm against `OpenClawPluginApi` — active-memory uses `api.on`, `extensions/active-memory/index.ts:3004`). Verify `ctx.messageProvider` is populated for HA runs in the live test (Task 7); if it is undefined there, broaden `shouldInjectHaGuidance` to also accept `ctx.agentId?.startsWith("home-")` — but messageProvider is the correct discriminator for the `main` agent.

- [ ] **Step 6: Typecheck + plugin tests**

Run: `OPENCLAW_LOCAL_CHECK=1 node scripts/run-tsgo.mjs -p tsconfig.extensions.json` (no `error TS`)
Run: `pnpm test extensions/homeassistant` (all pass)

- [ ] **Step 7: Commit**

```bash
scripts/committer "homeassistant: inject capture/suggestion guidance into HA runs (before_prompt_build)" \
  extensions/homeassistant/src/memory-guidance.ts \
  extensions/homeassistant/src/memory-guidance.test.ts \
  extensions/homeassistant/index.ts
```

---

### Task 6: Config wiring, build & deploy

**Files:**

- Modify: live `~/.openclaw/openclaw.json` (NOT the repo)
- Build + restart the gateway

Context: deployment quirks are in memory `ha-deploy-env` — gateway runs `dist/`; test the gateway on `127.0.0.1` (OrbStack squats IPv6 `:18789`); restart via launchd.

- [ ] **Step 1: Enable active-memory for HA agents + allow the `remember` tool** — edit `~/.openclaw/openclaw.json`:
  - `plugins.entries.active-memory.enabled = true` (if not already), and
    `plugins.entries.active-memory.config.agents = ["main", "home-*"]`.
  - Allow `remember` despite the messaging profile: top-level `tools.alsoAllow` includes `"remember"`
    (additive; `ToolPolicyConfig.alsoAllow`, `src/config/types.tools.ts:251-257`). Example:
    ```json
    "tools": { "alsoAllow": ["remember"] }
    ```
    Do not print secret values from the file.

- [ ] **Step 2: Build dist + copy manifest** (pnpm is healthy now; either works — the fast path is quicker):

```bash
cd /Users/admin/dev/openclaw
OPENCLAW_BUILD_ALL_NO_PNPM=1 node scripts/tsdown-build.mjs && node scripts/copy-bundled-plugin-metadata.mjs
```

Verify: `node -e 'console.log(require("/Users/admin/dev/openclaw/dist/extensions/homeassistant/openclaw.plugin.json").contracts.tools)'` includes `remember`; `grep -c "before_prompt_build" dist/extensions/homeassistant/index.js` ≥ 1.

- [ ] **Step 3: Restart the gateway and confirm it loads**

```bash
launchctl kickstart -k "gui/$UID/ai.openclaw.gateway"
# wait, then:
tail -20 ~/.openclaw/logs/gateway.log | grep -E "ready|homeassistant"
tail -20 ~/.openclaw/logs/gateway.err.log | grep -iE "remember|active-memory|error" || echo "(no errors)"
```

Expected: `[gateway] ready`, no tool-registration or hook errors.

- [ ] **Step 4: Commit** (none — config is live-only; repo code already committed in Tasks 1-5).

---

### Task 7: Live end-to-end verification (real behavior proof)

**Files:** none (verification only). Use `127.0.0.1` for the gateway. Secret: `~/.openclaw/openclaw.json` → `plugins.entries.homeassistant.config.secret`.

- [ ] **Step 1: Capture + visible confirmation.** As a non-admin test user (`user_id: "memtest1"`), send a message that shares a durable fact (e.g. "I'm vegetarian and I love lo-fi playlists"). Verify via the `/send`→SSE round-trip (see memory `ha-deploy-env` for the curl pattern) that the reply **acknowledges** remembering, and that `~/.openclaw/state/workspace-home-memtest1/memory/<today>.md` (or the resolved per-agent workspace) contains the captured line. Expected: an acknowledgment + a written memory bullet.

- [ ] **Step 2: Per-person isolation.** As a second user (`user_id: "memtest2"`), ask "what do you know about me?" / "any food preferences?". Verify the reply does **not** surface memtest1's vegetarian/lo-fi facts. Confirm a separate `workspace-home-memtest2/` exists. Expected: no cross-user leakage.

- [ ] **Step 3: Recall + proactive suggestion.** As memtest1 in a NEW conversation, ask for music. Verify the assistant proactively suggests lo-fi (recall via active-memory). Expected: suggestion grounded in the remembered preference.

- [ ] **Step 4: Owner unaffected on other channels.** Confirm the `main` agent on a non-HA channel does not receive the HA guidance prepend (spot-check: the guidance only injects when `messageProvider === "homeassistant"`).

- [ ] **Step 5: Run a fresh `$autoreview`** on the full change set (Tasks 1-5) and address any accepted findings before considering v1 done.

---

## Out of scope (v2, do not build here)

- Shared **household** layer via periodic extraction from per-person stores.
- A hard **delete/forget** tool (v1 corrects via append + reconciliation).
- Kiosk identity disambiguation (kiosk = owner, already resolved).
