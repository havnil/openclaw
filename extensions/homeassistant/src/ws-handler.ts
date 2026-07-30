import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import type { WebSocket } from "ws";
import { verifyHandshake } from "./auth.js";
import { getHaTranscribe } from "./channel.js";
import { ConversationStore, generateTitle } from "./conversations.js";
import type { HaUserIdentity, StoredMessage } from "./protocol.js";

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

function send(ws: WebSocket, msg: Record<string, unknown>): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
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

  // Keepalive ping every 30s
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30_000);

  ws.on("pong", () => {
    send(ws, { type: "pong" });
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
    activeAbortController?.abort();
  });

  ws.on("message", async (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    const type = msg.type as string;

    switch (type) {
      case "list_conversations": {
        const list = await deps.conversationStore.list(user.user_id);
        send(ws, {
          type: "conversations_list",
          conversations: list.map((c) => ({
            id: c.id,
            title: c.title,
            updated_at: c.updated_at,
          })),
        });
        break;
      }

      case "new_conversation": {
        const conv = await deps.conversationStore.create(user.user_id);
        activeConversationId = conv.id;
        send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        break;
      }

      case "get_history":
      case "load_conversation": {
        const convId = (msg.conversation_id as string) ?? "";
        const conv = await deps.conversationStore.load(convId, user.user_id);
        if (!conv) {
          send(ws, { type: "error", message: "Conversation not found" });
          break;
        }
        activeConversationId = conv.id;
        send(ws, {
          type: "conversation_history",
          conversation_id: conv.id,
          title: conv.title,
          messages: conv.messages.map((m) => ({
            id: m.timestamp,
            role: m.role,
            content: m.text,
            ts: m.timestamp,
            attachments: m.attachments,
            tool_call: m.tool_calls?.[0]
              ? { name: m.tool_calls[0].name, output: m.tool_calls[0].output }
              : undefined,
          })),
        });
        break;
      }

      case "delete_conversation": {
        const convId = msg.conversation_id as string;
        await deps.conversationStore.delete(convId, user.user_id);
        if (activeConversationId === convId) {
          activeConversationId = null;
        }
        send(ws, { type: "conversation_deleted", id: convId });
        break;
      }

      case "rename_conversation": {
        const convId = msg.conversation_id as string;
        const title = msg.title as string;
        await deps.conversationStore.rename(convId, user.user_id, title);
        send(ws, { type: "conversation_renamed", id: convId, title });
        break;
      }

      case "stop_stream":
      case "stop_generating": {
        activeAbortController?.abort();
        activeAbortController = null;
        break;
      }

      case "message": {
        // Panel sends "content", protocol spec uses "text"
        const text = (msg.content as string) ?? (msg.text as string) ?? "";
        const streamId = msg.stream_id as string | undefined;
        const clientConvId = msg.conversation_id as string | undefined;

        // Auto-create conversation if none active
        if (!activeConversationId && !clientConvId) {
          const conv = await deps.conversationStore.create(user.user_id);
          activeConversationId = conv.id;
          send(ws, { type: "conversation_created", id: conv.id, title: conv.title });
        }

        const convId = clientConvId ?? activeConversationId!;

        // Save user message
        const userMsg: StoredMessage = {
          role: "user",
          text,
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
            text,
            conversationId: convId,
            onToken: (token) => {
              fullText += token;
              send(ws, { type: "stream_token", stream_id: streamId, token });
            },
            onToolUse: (name, input) => {
              send(ws, {
                type: "tool_call",
                conversation_id: convId,
                tool_name: name,
                input,
              });
            },
            onToolResult: (name, output, isError) => {
              toolCalls.push({ name, input: {}, output });
              send(ws, {
                type: "tool_call",
                conversation_id: convId,
                tool_name: name,
                output,
                is_error: isError || undefined,
              });
            },
            onDone: (doneText) => {
              fullText = doneText;
              send(ws, { type: "stream_done", stream_id: streamId, full_text: doneText });
            },
            onError: (message) => {
              send(ws, { type: "stream_error", stream_id: streamId, error: message });
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

          // Auto-generate title from the first exchange only
          const conv = await deps.conversationStore.load(convId, user.user_id);
          if (conv && conv.title === "New conversation") {
            const title = generateTitle(text);
            await deps.conversationStore.rename(convId, user.user_id, title);
            send(ws, { type: "conversation_renamed", id: convId, title });
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            send(ws, { type: "stream_error", stream_id: streamId, error: String(err) });
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
        const streamId = msg.stream_id as string | undefined;
        const fileName = msg.file_name as string;
        const mimeType = msg.mime_type as string;
        const data = msg.data as string;
        const abortController = new AbortController();
        activeAbortController = abortController;

        const userMsg: StoredMessage = {
          role: "user",
          text: `[Uploaded: ${fileName}]`,
          timestamp: new Date().toISOString(),
          attachments: [{ file_name: fileName, mime_type: mimeType }],
        };
        await deps.conversationStore.appendMessage(convId, user.user_id, userMsg);

        let fullText = "";
        try {
          await deps.dispatchMessage({
            user,
            text: `[User uploaded file: ${fileName}]`,
            conversationId: convId,
            attachments: [{ file_name: fileName, mime_type: mimeType, data }],
            onToken: (token) => {
              fullText += token;
              send(ws, { type: "stream_token", stream_id: streamId, token });
            },
            onToolUse: (name, input) =>
              send(ws, { type: "tool_call", conversation_id: convId, tool_name: name, input }),
            onToolResult: (name, output, isError) =>
              send(ws, {
                type: "tool_call",
                conversation_id: convId,
                tool_name: name,
                output,
                is_error: isError || undefined,
              }),
            onDone: (doneText) => {
              fullText = doneText;
              send(ws, { type: "stream_done", stream_id: streamId, full_text: doneText });
            },
            onError: (message) =>
              send(ws, { type: "stream_error", stream_id: streamId, error: message }),
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
            send(ws, { type: "stream_error", stream_id: streamId, error: String(err) });
          }
        } finally {
          activeAbortController = null;
        }
        break;
      }

      case "transcribe": {
        const audioBase64 = msg.audio as string;
        const mime = (msg.mime as string) || "audio/webm";
        const requestId = msg.request_id as string | undefined;

        if (!audioBase64) {
          send(ws, { type: "transcription", request_id: requestId, error: "No audio data" });
          break;
        }

        const transcribe = getHaTranscribe();
        if (!transcribe) {
          send(ws, {
            type: "transcription",
            request_id: requestId,
            error: "Transcription not available",
          });
          break;
        }

        try {
          const audioBuffer = Buffer.from(audioBase64, "base64");
          const result = await transcribe({ audioData: audioBuffer, mime });
          const text = result.text || "";

          // Gibberish detection: very short or mostly non-word characters
          const isGibberish =
            text.length > 0 &&
            (text.length < 3 || /^[^a-zA-ZæøåÆØÅàáâãäéèêëíìîïóòôõöúùûü\s]{3,}$/.test(text));

          send(ws, {
            type: "transcription",
            request_id: requestId,
            text: isGibberish ? "" : text,
            retry: isGibberish || !text,
          });
        } catch (err) {
          send(ws, {
            type: "transcription",
            request_id: requestId,
            error: String(err),
          });
        }
        break;
      }
    }
  });
}
