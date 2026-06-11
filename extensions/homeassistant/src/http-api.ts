import type { IncomingMessage, ServerResponse } from "node:http";
import type { HaDispatchFn, HaTranscribeFn } from "./channel.js";
import type { ConversationStore } from "./conversations.js";
import type { HaUserIdentity, StoredMessage } from "./protocol.js";
import { StreamHub } from "./stream-hub.js";

export type HaHttpApiDeps = {
  hub: StreamHub;
  getStore: () => ConversationStore | null;
  getDispatch: () => HaDispatchFn | null;
  getTranscribe: () => HaTranscribeFn | null;
  getSecret: () => string;
  getCfg: () => unknown;
  resolveUser: (body: Record<string, unknown>) => HaUserIdentity;
};

export type HaHttpApi = {
  handle(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
  hub: StreamHub;
};

function cors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-openclaw-secret");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function json(res: ServerResponse, status: number, body: unknown): void {
  cors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function authOk(
  secret: string,
  headerValue: string | string[] | undefined,
  bodyValue: unknown,
): boolean {
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof fromHeader === "string" && fromHeader === secret) {
    return true;
  }
  if (typeof bodyValue === "string" && bodyValue === secret) {
    return true;
  }
  return false;
}

async function handleStream(
  req: IncomingMessage,
  res: ServerResponse,
  deps: HaHttpApiDeps,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const secret = deps.getSecret();
  const headerSecret = req.headers["x-openclaw-secret"];
  const querySecret = url.searchParams.get("secret");

  if (!authOk(secret, headerSecret, querySecret)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const conversationId = url.searchParams.get("conversation_id") ?? "";

  cors(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.write(": connected\n\n");

  const unsub = deps.hub.subscribe(conversationId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const pingInterval = setInterval(() => {
    res.write(": ping\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(pingInterval);
    unsub();
  });
}

async function handleSend(
  req: IncomingMessage,
  res: ServerResponse,
  deps: HaHttpApiDeps,
): Promise<void> {
  const body = await readBody(req);
  const secret = deps.getSecret();
  const headerSecret = req.headers["x-openclaw-secret"];

  if (!authOk(secret, headerSecret, body.secret)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const store = deps.getStore();
  const dispatch = deps.getDispatch();

  if (!store || !dispatch) {
    json(res, 503, { error: "Service unavailable" });
    return;
  }

  const user = deps.resolveUser(body);
  const text = String(body.text ?? "");
  let conversationId = typeof body.conversation_id === "string" ? body.conversation_id : undefined;
  let newConversation = false;

  if (!conversationId) {
    const conv = await store.create(user.user_id);
    conversationId = conv.id;
    newConversation = true;
  }

  const convId = conversationId;

  const userMessage: StoredMessage = {
    role: "user",
    text,
    timestamp: new Date().toISOString(),
  };
  await store.appendMessage(convId, user.user_id, userMessage);

  json(res, 200, { conversation_id: convId, new_conversation: newConversation });

  // Fire-and-forget dispatch
  void (async () => {
    let accumulated = "";

    try {
      await dispatch({
        cfg: deps.getCfg() as Parameters<HaDispatchFn>[0]["cfg"],
        user,
        text,
        conversationId: convId,
        onToken: (token: string) => {
          accumulated += token;
          deps.hub.publish(convId, { type: "token", token });
        },
        onToolActivity: () => {
          deps.hub.publish(convId, { type: "tool" });
        },
        onDone: (fullText: string) => {
          deps.hub.publish(convId, { type: "done", full_text: fullText });
        },
        onError: (error: string) => {
          deps.hub.publish(convId, { type: "error", error });
        },
        signal: new AbortController().signal,
      });

      const assistantMessage: StoredMessage = {
        role: "assistant",
        text: accumulated,
        timestamp: new Date().toISOString(),
      };
      await store.appendMessage(convId, user.user_id, assistantMessage);

      // Auto-title on first message: if title is still the default, derive one from the user text.
      const conv = await store.load(convId, user.user_id);
      if (conv && conv.title === "New conversation") {
        const title = generateTitle(text);
        await store.rename(convId, user.user_id, title);
        deps.hub.publish(convId, { type: "title", title });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.hub.publish(convId, { type: "error", error: message });
    }
  })();
}

async function handleConversations(
  req: IncomingMessage,
  res: ServerResponse,
  deps: HaHttpApiDeps,
): Promise<void> {
  const body = await readBody(req);
  const secret = deps.getSecret();
  const headerSecret = req.headers["x-openclaw-secret"];

  if (!authOk(secret, headerSecret, body.secret)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const store = deps.getStore();
  if (!store) {
    json(res, 503, { error: "Channel not started" });
    return;
  }

  const action = typeof body.action === "string" ? body.action : "";
  const userId = typeof body.user_id === "string" ? body.user_id : "";
  if (!userId) {
    json(res, 400, { error: "Missing user_id" });
    return;
  }

  switch (action) {
    case "list": {
      const list = await store.list(userId);
      json(res, 200, {
        conversations: list.map((c) => ({ id: c.id, title: c.title, updated_at: c.updated_at })),
      });
      break;
    }
    case "create": {
      const conv = await store.create(userId);
      json(res, 200, { id: conv.id, title: conv.title });
      break;
    }
    case "load": {
      const convId = typeof body.conversation_id === "string" ? body.conversation_id : "";
      const conv = await store.load(convId, userId);
      if (!conv) {
        json(res, 404, { error: "Conversation not found" });
        break;
      }
      json(res, 200, {
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
      const convId = typeof body.conversation_id === "string" ? body.conversation_id : "";
      await store.delete(convId, userId);
      json(res, 200, { deleted: true });
      break;
    }
    case "rename": {
      const convId = typeof body.conversation_id === "string" ? body.conversation_id : "";
      const title = typeof body.title === "string" ? body.title : "";
      await store.rename(convId, userId, title);
      json(res, 200, { renamed: true });
      break;
    }
    default:
      json(res, 400, { error: `Unknown action: ${action}` });
  }
}

async function handleTranscribe(
  req: IncomingMessage,
  res: ServerResponse,
  deps: HaHttpApiDeps,
): Promise<void> {
  const body = await readBody(req);
  const secret = deps.getSecret();
  const headerSecret = req.headers["x-openclaw-secret"];

  if (!authOk(secret, headerSecret, body.secret)) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const transcribe = deps.getTranscribe();
  if (!transcribe) {
    json(res, 503, { error: "Transcription not available" });
    return;
  }

  const audioBase64 = typeof body.audio === "string" ? body.audio : "";
  const mime = typeof body.mime === "string" ? body.mime : "audio/webm";

  if (!audioBase64) {
    json(res, 400, { error: "No audio data" });
    return;
  }

  try {
    const audioData = Buffer.from(audioBase64, "base64");
    const result = await transcribe({ audioData, mime });
    const text = result.text ?? "";
    // Only flag as gibberish if very short AND no real letters
    const isGibberish = text.length > 0 && text.length < 2;
    json(res, 200, { text: isGibberish ? "" : text, retry: isGibberish || !text });
  } catch (err) {
    json(res, 500, { error: String(err) });
  }
}

function generateTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 40) {
    return cleaned;
  }
  const truncated = cleaned.slice(0, 40);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

const BASE = "/api/homeassistant";

export function createHaHttpApi(deps: HaHttpApiDeps): HaHttpApi {
  const hub = deps.hub;

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = req.url ?? "";
    const path = url.split("?")[0];

    if (!path.startsWith(BASE)) {
      return false;
    }

    const sub = path.slice(BASE.length);

    if (req.method === "OPTIONS") {
      cors(res);
      res.statusCode = 204;
      res.end();
      return true;
    }

    if (req.method === "GET" && sub === "/stream") {
      await handleStream(req, res, deps);
      return true;
    }

    if (req.method === "POST" && sub === "/send") {
      await handleSend(req, res, deps);
      return true;
    }

    if (req.method === "POST" && sub === "/conversations") {
      await handleConversations(req, res, deps);
      return true;
    }

    if (req.method === "POST" && sub === "/transcribe") {
      await handleTranscribe(req, res, deps);
      return true;
    }

    return false;
  }

  return { handle, hub };
}
