import type { OpenClawConfig } from "openclaw/plugin-sdk/account-resolution";
import { resolveAgentWorkspaceDir } from "openclaw/plugin-sdk/agent-runtime";
import {
  defineBundledChannelEntry,
  type OpenClawPluginApi,
} from "openclaw/plugin-sdk/channel-entry-contract";
import { Type } from "typebox";
import {
  ensureConversationStore,
  getHaDispatch,
  getHaTranscribe,
  isAdmin,
  resolveAccount,
  setHaDispatch,
  setHaTranscribe,
} from "./src/channel.js";
import { runHaDispatch } from "./src/dispatch.js";
import { createHaHttpApi } from "./src/http-api.js";
import { buildHaPrependContext } from "./src/memory-guidance.js";
import type { HaUserIdentity } from "./src/protocol.js";
import { appendMemoryLine, localDateStamp } from "./src/remember.js";
import { StreamHub } from "./src/stream-hub.js";

export { homeAssistantPlugin } from "./src/channel.js";

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

/**
 * Resolve a user identity from a request body.
 * Auth is already verified (secret checked by handleSend/handleConversations/handleTranscribe)
 * before this is called; we just map the body fields to an HaUserIdentity.
 */
function resolveUser(body: Record<string, unknown>, cfg: unknown): HaUserIdentity {
  const userId = typeof body.user_id === "string" ? body.user_id : "anonymous";
  const userName = typeof body.user_name === "string" ? body.user_name : userId;
  const account = resolveAccount(cfg as OpenClawConfig);
  return {
    user_id: userId,
    user_name: userName,
    is_admin: isAdmin(userId, account.admins),
  };
}

function registerFull(api: OpenClawPluginApi): void {
  const cfg = api.pluginConfig as unknown as HaConfig;
  const ha = haClient(cfg);

  // ── Wire in-process AI dispatch ──────────────────────────────────────────
  setHaDispatch(runHaDispatch);

  // Inject HA run context: memory guidance for every HA run, plus the household persona for
  // the shared home-* agents (the owner's main agent keeps its own identity).
  api.on("before_prompt_build", (_event, ctx) => {
    const prependContext = buildHaPrependContext(ctx);
    return prependContext ? { prependContext } : undefined;
  });

  // ── Wire audio transcription via OC's media understanding pipeline ─────
  setHaTranscribe(async ({ audioData, mime }) => {
    const { writeFile, unlink } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { randomUUID } = await import("node:crypto");
    const ext = mime.includes("webm")
      ? "webm"
      : mime.includes("mp4")
        ? "m4a"
        : mime.includes("wav")
          ? "wav"
          : mime.includes("aac")
            ? "aac"
            : "ogg";
    const tmpPath = join(
      (await import("node:os")).tmpdir(),
      `openclaw-ha-audio-${randomUUID()}.${ext}`,
    );
    try {
      await writeFile(tmpPath, audioData);
      const result = await api.runtime.mediaUnderstanding.transcribeAudioFile({
        filePath: tmpPath,
        cfg: api.config,
        mime,
      });
      return { text: result.text?.trim() || undefined };
    } finally {
      // Remove the temp clip promptly; do not retain user voice data on disk.
      await unlink(tmpPath).catch(() => {});
    }
  });

  // ── Serve panel via HTTP+SSE ─────────────────────────────────────────────
  // Own the store in this (full-mode) instance so the HTTP handler never depends
  // on the channel `start` hook, which may run in a different load instance.
  const store = ensureConversationStore();
  const hub = new StreamHub();
  const haApi = createHaHttpApi({
    hub,
    getStore: () => store,
    getDispatch: () => getHaDispatch(),
    getSecret: () => resolveAccount(api.config as OpenClawConfig).secret,
    getCfg: () => api.config,
    // getHaTranscribe returns the live function wired above via setHaTranscribe
    getTranscribe: () => getHaTranscribe(),
    resolveUser: (body) => resolveUser(body, api.config),
  });

  // Plugin auth: the handler performs its own secret check inside haApi.
  api.registerHttpRoute({
    path: "/api/homeassistant",
    match: "prefix",
    auth: "plugin",
    handler: (req, res) => haApi.handle(req, res),
  });

  // ── ha_get_states ─────────────────────────────────────────────────────────
  api.registerTool({
    name: "ha_get_states",
    label: "Get States",
    description:
      "Get the current state of one or all Home Assistant entities. " +
      "Pass an entity_id to get a single entity, or omit it to get all states.",
    parameters: Type.Object({
      entity_id: Type.Optional(Type.String({ description: "Entity ID, e.g. light.living_room" })),
    }),
    async execute(_id, params) {
      const { entity_id } = params as { entity_id?: string };
      const path = entity_id ? `/api/states/${entity_id}` : "/api/states";
      const data = await ha.request("GET", path);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        details: {},
      };
    },
  });

  // ── ha_call_service ───────────────────────────────────────────────────────
  api.registerTool({
    name: "ha_call_service",
    label: "Call Service",
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
      const { domain, service, service_data } = params as {
        domain: string;
        service: string;
        service_data?: Record<string, unknown>;
      };
      const data = await ha.request(
        "POST",
        `/api/services/${domain}/${service}`,
        service_data ?? {},
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        details: {},
      };
    },
  });

  // ── ha_get_history ────────────────────────────────────────────────────────
  api.registerTool(
    {
      name: "ha_get_history",
      label: "Get History",
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
        const { entity_ids, hours_back } = params as {
          entity_ids: string[];
          hours_back?: number;
        };
        const hours = hours_back ?? 24;
        const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        const ids = entity_ids.join(",");
        const data = await ha.request(
          "GET",
          `/api/history/period/${start}?filter_entity_id=${ids}&minimal_response`,
        );
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
          details: {},
        };
      },
    },
    { optional: true },
  );

  // ── ha_fire_event ─────────────────────────────────────────────────────────
  api.registerTool(
    {
      name: "ha_fire_event",
      label: "Fire Event",
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
        const { event_type, event_data } = params as {
          event_type: string;
          event_data?: Record<string, unknown>;
        };
        const data = await ha.request("POST", `/api/events/${event_type}`, event_data ?? {});
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
          details: {},
        };
      },
    },
    { optional: true },
  );

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
        // Fail closed: never default a missing agent id to "main" — that would write one
        // person's fact into the owner's memory. (In practice ctx.workspaceDir is always set.)
        const workspaceDir =
          toolCtx.workspaceDir ??
          (cfg && toolCtx.agentId ? resolveAgentWorkspaceDir(cfg, toolCtx.agentId) : undefined);
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
}

export default defineBundledChannelEntry({
  id: "homeassistant",
  name: "Home Assistant",
  description:
    "Home Assistant channel and tools — chat interface with WebSocket streaming and REST API control",
  importMetaUrl: import.meta.url,
  plugin: { specifier: "./src/channel.js", exportName: "homeAssistantPlugin" },
  registerFull,
});
