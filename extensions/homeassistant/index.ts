import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";
import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import {
  createReplyDispatcher,
  dispatchInboundMessage,
  finalizeInboundContext,
} from "openclaw/plugin-sdk/reply-runtime";
import { WebSocketServer } from "ws";
import { ConversationStore } from "./src/conversations.js";
import { handleHaWebSocket } from "./src/ws-handler.js";

interface HaConfig {
  url?: string;
  token: string;
  secret?: string;
  admins?: string[];
  ws_port?: number;
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
    const cfg = api.pluginConfig as unknown as HaConfig;
    const ha = haClient(cfg);

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
        const path = params.entity_id ? `/api/states/${params.entity_id}` : "/api/states";
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
        const data = await ha.request(
          "POST",
          `/api/services/${params.domain}/${params.service}`,
          params.service_data ?? {},
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
          const hours = params.hours_back ?? 24;
          const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
          const ids = params.entity_ids.join(",");
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
          const data = await ha.request(
            "POST",
            `/api/events/${params.event_type}`,
            params.event_data ?? {},
          );
          return {
            content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
            details: {},
          };
        },
      },
      { optional: true },
    );

    // ── WebSocket channel (only when secret is configured) ────────────────────
    if (cfg.secret) {
      const secret = cfg.secret;
      const admins = cfg.admins ?? [];

      // Conversation storage under ~/.openclaw/homeassistant/conversations
      const storeDir = join(homedir(), ".openclaw", "homeassistant", "conversations");
      const conversationStore = new ConversationStore(storeDir);

      // Standalone WebSocket server on a dedicated port (gateway intercepts
      // upgrade events on its own HTTP server, so we need our own listener).
      const wsPort = cfg.ws_port ?? 18790;
      const wss = new WebSocketServer({ port: wsPort, host: "0.0.0.0" });

      wss.on("connection", (ws, req) => {
        handleHaWebSocket(ws, req, {
          configSecret: secret,
          admins,
          conversationStore,
          async dispatchMessage({ user, text, onToken, onToolUse, onDone, onError }) {
            const fullCfg = api.config;
            const agentId = "main";

            const ctxPayload = finalizeInboundContext({
              Body: text,
              BodyForAgent: text,
              BodyForCommands: text,
              RawBody: text,
              From: `ha:${user.user_id}`,
              To: `ha:${user.user_id}`,
              SessionKey: `ha:${user.user_id}`,
              SenderName: user.user_name,
              SenderId: user.user_id,
              Provider: "homeassistant" as const,
              Surface: "homeassistant" as const,
              OriginatingChannel: "homeassistant" as const,
              OriginatingTo: `ha:${user.user_id}`,
              CommandAuthorized: user.is_admin,
            });

            const replyPipeline = createChannelReplyPipeline({
              cfg: fullCfg,
              agentId,
              channel: "homeassistant",
            });

            const dispatcher = createReplyDispatcher({
              ...replyPipeline,
              deliver: async (payload) => {
                if (payload.text) {
                  onDone(payload.text);
                }
              },
              onError: (err) => {
                onError(String(err));
              },
            });

            await dispatchInboundMessage({
              ctx: ctxPayload,
              cfg: fullCfg,
              dispatcher,
              replyOptions: {
                onPartialReply: async (payload) => {
                  if (payload.text) {
                    onToken(payload.text);
                  }
                },
                onToolStart: async (payload) => {
                  if (payload.name) {
                    onToolUse(payload.name, {});
                  }
                },
              },
            });
          },
        });
      });

      api.logger.info(
        `Home Assistant plugin registered (4 tools + WebSocket channel on port ${wsPort})`,
      );
    } else {
      api.logger.info("Home Assistant plugin registered (4 tools)");
    }
  },
});
