/**
 * Home Assistant Channel Plugin for OpenClaw.
 *
 * Registers as a proper channel so it appears in the OC UI under Channels,
 * with lifecycle management (start/stop) and status reporting.
 */

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createTlsServer } from "node:https";
import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk/account-resolution";
import { waitUntilAbort } from "openclaw/plugin-sdk/channel-lifecycle";
import { createChatChannelPlugin, type ChannelPlugin } from "openclaw/plugin-sdk/core";
import { WebSocketServer } from "ws";
import { ConversationStore } from "./conversations.js";
import { handleHaWebSocket } from "./ws-handler.js";

const CHANNEL_ID = "homeassistant";
const DEFAULT_WS_PORT = 18790;

export interface ResolvedHaAccount {
  accountId: string;
  url: string;
  token: string;
  secret: string;
  admins: string[];
  wsPort: number;
  tlsCert?: string;
  tlsKey?: string;
}

function getPluginConfig(cfg: OpenClawConfig): Record<string, unknown> {
  const full = cfg as Record<string, unknown>;
  // Channel config lives at channels.homeassistant (standard channel path).
  const fromChannel = (full.channels as Record<string, unknown> | undefined)?.homeassistant as
    | Record<string, unknown>
    | undefined;
  // Fallback: plugins.entries.homeassistant.config (legacy plugin path).
  const fromPlugin = (
    (
      (full.plugins as Record<string, unknown> | undefined)?.entries as
        | Record<string, unknown>
        | undefined
    )?.homeassistant as Record<string, unknown> | undefined
  )?.config as Record<string, unknown> | undefined;
  return fromChannel ?? fromPlugin ?? {};
}

function resolveAccount(cfg: OpenClawConfig, _accountId?: string | null): ResolvedHaAccount {
  const config = getPluginConfig(cfg);
  return {
    accountId: "default",
    url: (config.url as string) ?? "http://localhost:8123",
    token: (config.token as string) ?? "",
    secret: (config.secret as string) ?? "",
    admins: Array.isArray(config.admins)
      ? (config.admins as string[])
      : typeof config.admins === "string"
        ? (config.admins as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    wsPort: (config.ws_port as number) ?? DEFAULT_WS_PORT,
    tlsCert: (config.tls_cert as string) ?? undefined,
    tlsKey: (config.tls_key as string) ?? undefined,
  };
}

type HaChannelGatewayContext = {
  cfg: OpenClawConfig;
  accountId: string;
  abortSignal: AbortSignal;
  log?: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
};

export type HaChannelPlugin = ChannelPlugin<ResolvedHaAccount>;

/**
 * Dispatch callback type — set by the plugin entry when full runtime is
 * available (tools, AI pipeline, etc.).
 */
export type HaDispatchFn = (params: {
  cfg: OpenClawConfig;
  user: import("./protocol.js").HaUserIdentity;
  text: string;
  conversationId: string;
  history?: Array<{ role: string; text: string; timestamp: string }>;
  attachments?: Array<{ file_name: string; mime_type: string; data: string }>;
  onToken: (text: string) => void;
  onToolUse: (name: string, input: Record<string, unknown>) => void;
  onToolResult: (name: string, output: string, isError: boolean) => void;
  onDone: (fullText: string) => void;
  onError: (message: string) => void;
  signal: AbortSignal;
}) => Promise<void>;

let dispatchFn: HaDispatchFn | null = null;

export function setHaDispatch(fn: HaDispatchFn): void {
  dispatchFn = fn;
}

export function createHomeAssistantPlugin(): HaChannelPlugin {
  return createChatChannelPlugin({
    base: {
      id: CHANNEL_ID,
      meta: {
        id: CHANNEL_ID,
        label: "Home Assistant",
        selectionLabel: "Home Assistant (WebSocket)",
        detailLabel: "Home Assistant (WebSocket)",
        docsPath: "/channels/homeassistant",
        blurb: "ChatGPT-style chat panel in the Home Assistant sidebar",
        order: 85,
      },
      capabilities: {
        chatTypes: ["direct" as const],
        media: true,
        threads: false,
        reactions: false,
        edit: false,
        unsend: false,
        reply: false,
        effects: false,
        blockStreaming: false,
      },
      reload: { configPrefixes: [`plugins.entries.${CHANNEL_ID}`] },
      config: {
        listAccountIds: () => ["default"],
        resolveAccount: (cfg: OpenClawConfig, accountId?: string | null) =>
          resolveAccount(cfg, accountId),
        inspectAccount: (cfg: OpenClawConfig) => {
          const account = resolveAccount(cfg);
          return {
            enabled: !!account.token && !!account.secret,
            configured: !!account.token,
          };
        },
      },
      gateway: {
        startAccount: async (ctx: HaChannelGatewayContext) => {
          const { cfg, accountId, log, abortSignal } = ctx;
          const account = resolveAccount(cfg, accountId);

          if (!account.token) {
            log?.warn?.("Home Assistant token not configured — channel idle");
            return waitUntilAbort(abortSignal);
          }
          if (!account.secret) {
            log?.warn?.("Home Assistant secret not configured — WebSocket channel disabled");
            return waitUntilAbort(abortSignal);
          }

          const storeDir = join(homedir(), ".openclaw", "homeassistant", "conversations");
          const conversationStore = new ConversationStore(storeDir);

          // Create a dedicated HTTP(S) server for WebSocket upgrades.
          // The gateway intercepts WS upgrades on its own HTTP server,
          // so plugins that need WebSocket must bind their own listener
          // (same pattern as the voice-call plugin).
          // Use TLS when cert/key paths are configured (required for wss://
          // from HTTPS pages due to browser mixed-content policy).
          const useTls = account.tlsCert && account.tlsKey;
          const httpServer = useTls
            ? createTlsServer(
                {
                  cert: readFileSync(account.tlsCert!),
                  key: readFileSync(account.tlsKey!),
                },
                (_req, res) => {
                  res.writeHead(426, { "Content-Type": "text/plain" });
                  res.end("Upgrade Required");
                },
              )
            : createServer((_req, res) => {
                res.writeHead(426, { "Content-Type": "text/plain" });
                res.end("Upgrade Required");
              });

          const wss = new WebSocketServer({ noServer: true });

          httpServer.on("upgrade", (req, socket, head) => {
            wss.handleUpgrade(req, socket, head, (ws) => {
              handleHaWebSocket(ws, req, {
                configSecret: account.secret,
                admins: account.admins,
                conversationStore,
                async dispatchMessage(params) {
                  if (!dispatchFn) {
                    log?.error?.("AI dispatch not available — dispatchFn is null");
                    params.onError("AI dispatch not available — gateway still starting");
                    return;
                  }
                  try {
                    await dispatchFn({ cfg, ...params });
                  } catch (err) {
                    log?.error?.(`AI dispatch error: ${err}`);
                    params.onError(String(err));
                  }
                },
              });
            });
          });

          await new Promise<void>((resolve, reject) => {
            httpServer.on("error", reject);
            httpServer.listen(account.wsPort, "0.0.0.0", () => {
              const proto = useTls ? "wss" : "ws";
              log?.info?.(
                `Home Assistant WebSocket channel listening on ${proto}://0.0.0.0:${account.wsPort}`,
              );
              resolve();
            });
          });

          return waitUntilAbort(abortSignal, () => {
            log?.info?.(`Stopping Home Assistant channel (account: ${accountId})`);
            wss.close();
            httpServer.close();
          });
        },

        stopAccount: async (ctx: HaChannelGatewayContext) => {
          ctx.log?.info?.(`Home Assistant account ${ctx.accountId} stopped`);
        },
      },
    },
    security: {
      dm: {
        channelKey: CHANNEL_ID,
        resolvePolicy: () => "open",
        resolveAllowFrom: () => [],
        defaultPolicy: "open",
        approveHint: "openclaw pairing approve homeassistant <userId>",
      },
    },
    outbound: {
      deliveryMode: "gateway" as const,
      textChunkLimit: 4096,
      sendText: async () => {
        // HA channel is WebSocket-only; outbound messages are pushed via the
        // active WS connection, not through a REST callback.
        return { channel: CHANNEL_ID, messageId: `ha-${Date.now()}`, chatId: "ws" };
      },
      sendMedia: async () => {
        return { channel: CHANNEL_ID, messageId: `ha-${Date.now()}`, chatId: "ws" };
      },
    },
  }) as unknown as HaChannelPlugin;
}

export const homeAssistantPlugin = createHomeAssistantPlugin();
