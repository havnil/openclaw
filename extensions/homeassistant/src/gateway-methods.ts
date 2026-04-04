/**
 * Gateway methods for the Home Assistant channel.
 *
 * These are called by the HA panel via the gateway's native WebSocket,
 * using the same protocol as the OC control UI.
 */

import {
  getConversationStore,
  getHaDispatch,
  getHaTranscribe,
  isAdmin,
  resolveAccount,
} from "./channel.js";
import type { HaUserIdentity, StoredMessage } from "./protocol.js";

type GatewayMethodHandler = (opts: {
  params: Record<string, unknown>;
  respond: (ok: boolean, payload?: unknown, error?: unknown) => void;
  context: Record<string, unknown>;
}) => Promise<void> | void;

function verifyUser(
  params: Record<string, unknown>,
  cfg: unknown,
): { ok: true; user: HaUserIdentity } | { ok: false; error: string } {
  const secret = params.secret as string | undefined;
  const userId = params.user_id as string | undefined;
  const userName = params.user_name as string | undefined;

  const account = resolveAccount(
    cfg as import("openclaw/plugin-sdk/account-resolution").OpenClawConfig,
  );

  if (!secret || secret !== account.secret) {
    return { ok: false, error: "Invalid secret" };
  }
  if (!userId) {
    return { ok: false, error: "Missing user_id" };
  }

  return {
    ok: true,
    user: {
      user_id: userId,
      user_name: userName ?? userId,
      is_admin: isAdmin(userId, account.admins),
    },
  };
}

function generateTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 40) return cleaned;
  const truncated = cleaned.slice(0, 40);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * homeassistant.conversations — list, create, load, delete, rename conversations
 */
export const handleConversations: GatewayMethodHandler = async ({ params, respond }) => {
  const store = getConversationStore();
  if (!store) {
    respond(false, undefined, { message: "Channel not started" });
    return;
  }

  const action = params.action as string;
  const userId = params.user_id as string;
  if (!userId) {
    respond(false, undefined, { message: "Missing user_id" });
    return;
  }

  switch (action) {
    case "list": {
      const list = await store.list(userId);
      respond(true, {
        conversations: list.map((c) => ({
          id: c.id,
          title: c.title,
          updated_at: c.updated_at,
        })),
      });
      break;
    }
    case "create": {
      const conv = await store.create(userId);
      respond(true, { id: conv.id, title: conv.title });
      break;
    }
    case "load": {
      const convId = params.conversation_id as string;
      const conv = await store.load(convId, userId);
      if (!conv) {
        respond(false, undefined, { message: "Conversation not found" });
        break;
      }
      respond(true, {
        conversation_id: conv.id,
        title: conv.title,
        messages: conv.messages.map((m) => ({
          id: m.timestamp,
          role: m.role,
          content: m.text,
          ts: m.timestamp,
        })),
      });
      break;
    }
    case "delete": {
      await store.delete(params.conversation_id as string, userId);
      respond(true, { deleted: true });
      break;
    }
    case "rename": {
      await store.rename(params.conversation_id as string, userId, params.title as string);
      respond(true, { renamed: true });
      break;
    }
    default:
      respond(false, undefined, { message: `Unknown action: ${action}` });
  }
};

/**
 * homeassistant.send — send a chat message and stream the response
 */
export function createSendHandler(getCfg: () => unknown): GatewayMethodHandler {
  return async ({ params, respond, context }) => {
    const cfg = getCfg();
    const auth = verifyUser(params, cfg);
    if (!auth.ok) {
      respond(false, undefined, { message: auth.error });
      return;
    }

    const { user } = auth;
    const text = (params.content as string) ?? (params.text as string) ?? "";
    const clientConvId = params.conversation_id as string | undefined;
    const connId = params.conn_id as string | undefined;

    const store = getConversationStore();
    const dispatch = getHaDispatch();
    if (!store || !dispatch) {
      respond(false, undefined, { message: "Channel not ready" });
      return;
    }

    // Create conversation if needed
    let convId = clientConvId;
    let newConv = false;
    if (!convId) {
      const conv = await store.create(user.user_id);
      convId = conv.id;
      newConv = true;
    }

    // Save user message
    const userMsg: StoredMessage = {
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    await store.appendMessage(convId, user.user_id, userMsg);

    // Build the broadcast target (the calling client's connection)
    const broadcastToConn = (event: string, payload: unknown) => {
      if (connId && typeof (context as Record<string, unknown>).broadcastToConnIds === "function") {
        (
          context as {
            broadcastToConnIds: (e: string, p: unknown, ids: ReadonlySet<string>) => void;
          }
        ).broadcastToConnIds(event, payload, new Set([connId]));
      }
    };

    // Send initial response with conversation info
    respond(true, {
      conversation_id: convId,
      new_conversation: newConv,
    });

    // Stream AI response via broadcast events
    const abortController = new AbortController();
    let fullText = "";

    try {
      await dispatch({
        cfg: cfg as import("openclaw/plugin-sdk/account-resolution").OpenClawConfig,
        user,
        text,
        conversationId: convId,
        onToken: (token) => {
          fullText += token;
          broadcastToConn("homeassistant.token", { conversation_id: convId, token });
        },
        onDone: (doneText) => {
          fullText = doneText;
          broadcastToConn("homeassistant.done", { conversation_id: convId, full_text: doneText });
        },
        onError: (message) => {
          broadcastToConn("homeassistant.error", { conversation_id: convId, error: message });
        },
        signal: abortController.signal,
      });

      // Save assistant message
      const assistantMsg: StoredMessage = {
        role: "assistant",
        text: fullText,
        timestamp: new Date().toISOString(),
      };
      await store.appendMessage(convId, user.user_id, assistantMsg);

      // Auto-title on first message
      const conv = await store.load(convId, user.user_id);
      if (conv && conv.title === "New conversation") {
        const title = generateTitle(text);
        await store.rename(convId, user.user_id, title);
        broadcastToConn("homeassistant.title", { conversation_id: convId, title });
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        broadcastToConn("homeassistant.error", {
          conversation_id: convId,
          error: String(err),
        });
      }
    }
  };
}

/**
 * homeassistant.transcribe — transcribe audio via OC media understanding
 */
export const handleTranscribe: GatewayMethodHandler = async ({ params, respond }) => {
  const transcribe = getHaTranscribe();
  if (!transcribe) {
    respond(false, undefined, { message: "Transcription not available" });
    return;
  }

  const audioBase64 = params.audio as string;
  const mime = (params.mime as string) || "audio/webm";

  if (!audioBase64) {
    respond(false, undefined, { message: "No audio data" });
    return;
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    console.log(`[ha:transcribe] audio size: ${audioBuffer.length} bytes, mime: ${mime}`);
    const result = await transcribe({ audioData: audioBuffer, mime });
    const text = result.text || "";
    console.log(`[ha:transcribe] result: "${text}" (${text.length} chars)`);

    // Only flag as gibberish if it's very short AND has no real letters
    const isGibberish = text.length > 0 && text.length < 2;

    respond(true, {
      text: isGibberish ? "" : text,
      retry: isGibberish || !text,
    });
  } catch (err) {
    respond(false, undefined, { message: String(err) });
  }
};
