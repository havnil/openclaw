/**
 * Home Assistant Channel Plugin for OpenClaw.
 *
 * Uses the gateway's native WebSocket for real-time chat — no standalone
 * server, no custom ports. The HA panel connects to the same gateway WSS
 * endpoint as the OC control UI and calls gateway methods.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk/account-resolution";
import { waitUntilAbort } from "openclaw/plugin-sdk/channel-lifecycle";
import { createChatChannelPlugin, type ChannelPlugin } from "openclaw/plugin-sdk/core";
import { ConversationStore } from "./conversations.js";

const CHANNEL_ID = "homeassistant";

export interface ResolvedHaAccount {
  accountId: string;
  url: string;
  token: string;
  secret: string;
  admins: string[];
}

function getPluginConfig(cfg: OpenClawConfig): Record<string, unknown> {
  const full = cfg as Record<string, unknown>;
  const fromChannel = (full.channels as Record<string, unknown> | undefined)?.homeassistant as
    | Record<string, unknown>
    | undefined;
  const fromPlugin = (
    (
      (full.plugins as Record<string, unknown> | undefined)?.entries as
        | Record<string, unknown>
        | undefined
    )?.homeassistant as Record<string, unknown> | undefined
  )?.config as Record<string, unknown> | undefined;
  return fromChannel ?? fromPlugin ?? {};
}

export function resolveAccount(cfg: OpenClawConfig, _accountId?: string | null): ResolvedHaAccount {
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
  };
}

export function isAdmin(userId: string, admins: string[]): boolean {
  return admins.includes(userId);
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
 * Dispatch callback — set by the plugin entry when full runtime is available.
 */
export type HaDispatchFn = (params: {
  cfg: OpenClawConfig;
  user: import("./protocol.js").HaUserIdentity;
  text: string;
  conversationId: string;
  attachments?: Array<{ file_name: string; mime_type: string; data: string }>;
  onToken: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (message: string) => void;
  signal: AbortSignal;
}) => Promise<void>;

export type HaTranscribeFn = (params: {
  audioData: Buffer;
  mime: string;
}) => Promise<{ text?: string }>;

let dispatchFn: HaDispatchFn | null = null;
let transcribeFn: HaTranscribeFn | null = null;
let conversationStoreInstance: ConversationStore | null = null;

export function setHaDispatch(fn: HaDispatchFn): void {
  dispatchFn = fn;
}
export function getHaDispatch(): HaDispatchFn | null {
  return dispatchFn;
}

export function setHaTranscribe(fn: HaTranscribeFn): void {
  transcribeFn = fn;
}
export function getHaTranscribe(): HaTranscribeFn | null {
  return transcribeFn;
}

export function getConversationStore(): ConversationStore | null {
  return conversationStoreInstance;
}

export function createHomeAssistantPlugin(): HaChannelPlugin {
  return createChatChannelPlugin({
    base: {
      id: CHANNEL_ID,
      meta: {
        id: CHANNEL_ID,
        label: "Home Assistant",
        selectionLabel: "Home Assistant",
        detailLabel: "Home Assistant",
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
      reload: { configPrefixes: [`plugins.entries.${CHANNEL_ID}`, `channels.${CHANNEL_ID}`] },
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
            log?.warn?.("Home Assistant secret not configured — channel disabled");
            return waitUntilAbort(abortSignal);
          }

          // Initialize conversation store
          const storeDir = join(homedir(), ".openclaw", "homeassistant", "conversations");
          conversationStoreInstance = new ConversationStore(storeDir);

          log?.info?.("Home Assistant channel started (gateway methods)");

          return waitUntilAbort(abortSignal, () => {
            log?.info?.(`Stopping Home Assistant channel (account: ${accountId})`);
            conversationStoreInstance = null;
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
        return { channel: CHANNEL_ID, messageId: `ha-${Date.now()}`, chatId: "gw" };
      },
      sendMedia: async () => {
        return { channel: CHANNEL_ID, messageId: `ha-${Date.now()}`, chatId: "gw" };
      },
    },
  }) as unknown as HaChannelPlugin;
}

export const homeAssistantPlugin = createHomeAssistantPlugin();
