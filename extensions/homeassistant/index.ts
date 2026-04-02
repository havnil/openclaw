import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerPluginHttpRoute } from "openclaw/plugin-sdk/webhook-ingress";
import { WebSocketServer } from "ws";
import { ConversationStore } from "./src/conversations.js";
import { handleHaWebSocket } from "./src/ws-handler.js";

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

      // Single noServer WSS instance — shared across all connections on this route
      const wss = new WebSocketServer({ noServer: true });

      wss.on("connection", (ws, req) => {
        handleHaWebSocket(ws, req, {
          configSecret: secret,
          admins,
          conversationStore,
          // Placeholder dispatchMessage — echoes back until Task 11 wires the real AI pipeline
          async dispatchMessage({ text, onToken, onDone }) {
            const echo = `[placeholder] You said: ${text}`;
            onToken(echo);
            onDone(echo);
          },
        });
      });

      registerPluginHttpRoute({
        path: "/homeassistant/ws",
        auth: "gateway",
        pluginId: "homeassistant",
        handler(req, res) {
          // Handle WebSocket upgrade within the regular HTTP request pipeline.
          // Node delivers upgrade requests here when no dedicated "upgrade" listener
          // has claimed the socket first. We pull the raw socket off res and hand
          // it to the noServer WSS instance.
          const upgrade = req.headers["upgrade"];
          if (!upgrade || upgrade.toLowerCase() !== "websocket") {
            res.statusCode = 426;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end("Upgrade Required");
            return true;
          }

          // Perform the WebSocket handshake via the noServer WSS instance.
          // req.socket is the underlying Duplex stream; pass an empty head buffer
          // since we are not in a dedicated "upgrade" event handler.
          wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
            wss.emit("connection", ws, req);
          });
          return true;
        },
        log: (msg) => api.logger.info(msg),
      });

      api.logger.info(
        "Home Assistant plugin registered (4 tools + WebSocket channel at /homeassistant/ws)",
      );
    } else {
      api.logger.info("Home Assistant plugin registered (4 tools)");
    }
  },
});
