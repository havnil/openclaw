import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
import {
  createReplyDispatcher,
  dispatchInboundMessage,
  finalizeInboundContext,
} from "openclaw/plugin-sdk/reply-runtime";
import { runDetachedWebhookWork } from "openclaw/plugin-sdk/webhook-request-guards";
import { resolveHaAgentId } from "./agent-routing.js";
import type { HaDispatchFn } from "./channel.js";

export async function runHaDispatch(params: Parameters<HaDispatchFn>[0]): Promise<void> {
  // WS message events inherit the (long-released) admission of the original
  // WebSocket upgrade request; dispatching on that inherited chain is refused
  // with GatewayDrainingError as if the gateway were draining. Re-enter an
  // independent gateway work root per inbound message instead.
  return await runDetachedWebhookWork(() => runHaDispatchAdmitted(params));
}

async function runHaDispatchAdmitted(params: Parameters<HaDispatchFn>[0]): Promise<void> {
  const { cfg, user, text, conversationId, onToken, onToolActivity, onDone, onError } = params;

  const agentId = resolveHaAgentId(user);

  // Scope the agent session to the panel conversation, not the user. Each "new chat" is a
  // fresh conversation_id and therefore a fresh session, so the working transcript (and any
  // large ha_get_states results) never accumulates across chats. Cross-chat memory still
  // comes from the memory system (active-memory + MEMORY.md), not the session transcript.
  const sessionKey = `ha:${user.user_id}:${conversationId}`;

  const ctxPayload = finalizeInboundContext({
    Body: text,
    BodyForAgent: text,
    BodyForCommands: text,
    RawBody: text,
    From: `ha:${user.user_id}`,
    To: `ha:${user.user_id}`,
    SessionKey: sessionKey,
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
