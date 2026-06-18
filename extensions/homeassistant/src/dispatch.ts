import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
import {
  createReplyDispatcher,
  dispatchInboundMessage,
  finalizeInboundContext,
} from "openclaw/plugin-sdk/reply-runtime";
import { resolveHaAgentId } from "./agent-routing.js";
import type { HaDispatchFn } from "./channel.js";

export async function runHaDispatch(params: Parameters<HaDispatchFn>[0]): Promise<void> {
  const { cfg, user, text, onToken, onToolActivity, onDone, onError } = params;

  const agentId = resolveHaAgentId(user);

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
    AgentId: agentId,
    OriginatingChannel: "homeassistant" as const,
    OriginatingTo: `ha:${user.user_id}`,
    CommandAuthorized: user.is_admin,
  });

  const replyPipeline = createChannelReplyPipeline({
    cfg,
    agentId,
    channel: "homeassistant",
  });

  const dispatcher = createReplyDispatcher({
    ...replyPipeline,
    deliver: async (payload, info) => {
      // Tool results aren't shown in the panel, but signal generic tool
      // activity so the UI can show a "running a tool" indicator. The reply
      // dispatcher seam does not expose the tool name here.
      if (info.kind === "tool") {
        onToolActivity?.();
        return;
      }
      // Only send block/final replies to the panel.
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
    cfg,
    dispatcher,
    replyOptions: {
      onPartialReply: (() => {
        let lastSent = "";
        return async (payload: { text?: string }) => {
          if (payload.text && payload.text.length > lastSent.length) {
            const delta = payload.text.slice(lastSent.length);
            lastSent = payload.text;
            onToken(delta);
          }
        };
      })(),
    },
  });
}
