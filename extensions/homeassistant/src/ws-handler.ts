import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import type { WebSocket } from "ws";
import { verifyHandshake } from "./auth.js";
import { ConversationStore } from "./conversations.js";
import type { ClientMessage, ServerMessage, HaUserIdentity, StoredMessage } from "./protocol.js";

export interface HaWsHandlerDeps {
  configSecret: string;
  admins: string[];
  conversationStore: ConversationStore;
  /** Dispatch a user message through the AI pipeline and stream tokens back. */
  dispatchMessage: (params: {
    user: HaUserIdentity;
    text: string;
    conversationId: string;
    attachments?: Array<{ file_name: string; mime_type: string; data: string }>;
    onToken: (text: string) => void;
    onToolUse: (name: string, input: Record<string, unknown>) => void;
    onToolResult: (name: string, output: string, isError: boolean) => void;
    onDone: (fullText: string) => void;
    onError: (message: string) => void;
    signal: AbortSignal;
  }) => Promise<void>;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Generate a short conversation title from the first user message and AI reply.
 * Extracts the topic, truncates to ~40 chars.
 */
function generateTitle(userText: string, _assistantText: string): string {
  // Use the user's first message as the basis for the title.
  // Strip excessive whitespace and truncate.
  const cleaned = userText.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 40) return cleaned;
  // Truncate at a word boundary
  const truncated = cleaned.slice(0, 40);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

export function handleHaWebSocket(
  ws: WebSocket,
  req: IncomingMessage,
  deps: HaWsHandlerDeps,
): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const secret = url.searchParams.get("secret") ?? undefined;
  const userId = url.searchParams.get("user_id") ?? undefined;
  const userName = url.searchParams.get("user_name") ?? undefined;

  const authResult = verifyHandshake({
    secret,
    user_id: userId,
    user_name: userName,
    configSecret: deps.configSecret,
    admins: deps.admins,
  });

  if (!authResult.ok) {
    send(ws, { type: "error", message: authResult.error });
    ws.close(4001, authResult.error);
    return;
  }

  const user = authResult.user;
  let activeAbortController: AbortController | null = null;
  let activeConversationId: string | null = null;
  /** Track which conversations have had their title auto-generated. */
  const autoTitledConversations = new Set<string>();

  // Keepalive ping every 30s
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) ws.ping();
  }, 30_000);

  ws.on("pong", () => {
    send(ws, { type: "pong" });
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
    activeAbortController?.abort();
  });

  ws.on("message", async (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    switch (msg.type) {
      case "list_conversations": {
        const list = await deps.conversationStore.list(user.user_id);
        send(ws, { type: "conversations", list });
        break;
      }

      case "new_conversation": {
        const conv = await deps.conversationStore.create(user.user_id);
        activeConversationId = conv.id;
        send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        break;
      }

      case "load_conversation": {
        const conv = await deps.conversationStore.load(msg.conversation_id, user.user_id);
        if (!conv) {
          send(ws, { type: "error", message: "Conversation not found" });
          break;
        }
        activeConversationId = conv.id;
        send(ws, {
          type: "conversation_loaded",
          id: conv.id,
          title: conv.title,
          messages: conv.messages,
        });
        break;
      }

      case "delete_conversation": {
        await deps.conversationStore.delete(msg.conversation_id, user.user_id);
        if (activeConversationId === msg.conversation_id) {
          activeConversationId = null;
        }
        send(ws, { type: "conversation_deleted", id: msg.conversation_id });
        break;
      }

      case "rename_conversation": {
        await deps.conversationStore.rename(msg.conversation_id, user.user_id, msg.title);
        send(ws, { type: "conversation_renamed", id: msg.conversation_id, title: msg.title });
        break;
      }

      case "stop_generating": {
        activeAbortController?.abort();
        activeAbortController = null;
        break;
      }

      case "message": {
        // Auto-create conversation if none active
        if (!activeConversationId) {
          const conv = await deps.conversationStore.create(user.user_id);
          activeConversationId = conv.id;
          send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        }

        const convId = msg.conversation_id ?? activeConversationId;

        // Save user message
        const userMsg: StoredMessage = {
          role: "user",
          text: msg.text,
          timestamp: new Date().toISOString(),
        };
        await deps.conversationStore.appendMessage(convId, user.user_id, userMsg);

        // Dispatch to AI
        const abortController = new AbortController();
        activeAbortController = abortController;

        const toolCalls: StoredMessage["tool_calls"] = [];
        let fullText = "";

        try {
          await deps.dispatchMessage({
            user,
            text: msg.text,
            conversationId: convId,
            onToken: (text) => {
              fullText += text;
              send(ws, { type: "token", text });
            },
            onToolUse: (name, input) => {
              send(ws, { type: "tool_use", name, input });
            },
            onToolResult: (name, output, isError) => {
              toolCalls.push({ name, input: {}, output });
              send(ws, { type: "tool_result", name, output, is_error: isError || undefined });
            },
            onDone: (text) => {
              fullText = text;
              send(ws, { type: "done", full_text: text });
            },
            onError: (message) => {
              send(ws, { type: "error", message });
            },
            signal: abortController.signal,
          });

          // Save assistant message
          const assistantMsg: StoredMessage = {
            role: "assistant",
            text: fullText,
            timestamp: new Date().toISOString(),
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          };
          await deps.conversationStore.appendMessage(convId, user.user_id, assistantMsg);

          // Auto-generate title from the first exchange
          if (!autoTitledConversations.has(convId)) {
            autoTitledConversations.add(convId);
            const title = generateTitle(msg.text, fullText);
            await deps.conversationStore.rename(convId, user.user_id, title);
            send(ws, { type: "conversation_renamed", id: convId, title });
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            send(ws, { type: "error", message: String(err) });
          }
        } finally {
          activeAbortController = null;
        }
        break;
      }

      case "upload": {
        if (!activeConversationId) {
          const conv = await deps.conversationStore.create(user.user_id);
          activeConversationId = conv.id;
          send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        }

        const convId = activeConversationId;
        const abortController = new AbortController();
        activeAbortController = abortController;

        const userMsg: StoredMessage = {
          role: "user",
          text: `[Uploaded: ${msg.file_name}]`,
          timestamp: new Date().toISOString(),
          attachments: [{ file_name: msg.file_name, mime_type: msg.mime_type }],
        };
        await deps.conversationStore.appendMessage(convId, user.user_id, userMsg);

        let fullText = "";
        try {
          await deps.dispatchMessage({
            user,
            text: `[User uploaded file: ${msg.file_name}]`,
            conversationId: convId,
            attachments: [{ file_name: msg.file_name, mime_type: msg.mime_type, data: msg.data }],
            onToken: (text) => {
              fullText += text;
              send(ws, { type: "token", text });
            },
            onToolUse: (name, input) => send(ws, { type: "tool_use", name, input }),
            onToolResult: (name, output, isError) =>
              send(ws, { type: "tool_result", name, output, is_error: isError || undefined }),
            onDone: (text) => {
              fullText = text;
              send(ws, { type: "done", full_text: text });
            },
            onError: (message) => send(ws, { type: "error", message }),
            signal: abortController.signal,
          });

          const assistantMsg: StoredMessage = {
            role: "assistant",
            text: fullText,
            timestamp: new Date().toISOString(),
          };
          await deps.conversationStore.appendMessage(convId, user.user_id, assistantMsg);
        } catch (err) {
          if (!abortController.signal.aborted) {
            send(ws, { type: "error", message: String(err) });
          }
        } finally {
          activeAbortController = null;
        }
        break;
      }
    }
  });
}
