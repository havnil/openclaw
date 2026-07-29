import { u as normalizeAgentId } from "../../session-key-B_NoIfpX.js";
import { o as resolveAgentWorkspaceDir } from "../../agent-scope-config-KLbWcRY1.js";
import { t as dispatchInboundMessage } from "../../dispatch-oEPWP1zv.js";
import { n as createReplyDispatcher } from "../../reply-dispatcher.types-C5spQeBg.js";
import { t as finalizeInboundContext } from "../../inbound-context-CZx-NgvC.js";
import { i as createChatChannelPlugin } from "../../core-CJYgdGco.js";
import "../../routing-DaIp6Lht.js";
import { t as createChannelReplyPipeline } from "../../reply-pipeline-D-XnrYUo.js";
import { a as waitUntilAbort } from "../../channel-lifecycle.core-Bfh0_sXw.js";
import "../../reply-runtime-Br8MhAMA.js";
import "../../channel-reply-pipeline-BZWKeynN.js";
import "../../agent-runtime-BWcef-qM.js";
import { t as defineBundledChannelEntry } from "../../channel-entry-contract-BnevD6wz.js";
import "../../channel-lifecycle-BoiaHnmj.js";
import { join } from "node:path";
import { appendFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { Type } from "typebox";
//#region extensions/homeassistant/src/conversations.ts
var ConversationStore = class {
	constructor(baseDir) {
		this.baseDir = baseDir;
		this.writeLocks = /* @__PURE__ */ new Map();
	}
	userDir(userId) {
		return join(this.baseDir, userId);
	}
	convPath(userId, convId) {
		return join(this.userDir(userId), `${convId}.json`);
	}
	async withLock(key, fn) {
		const next = (this.writeLocks.get(key) ?? Promise.resolve()).then(fn, fn);
		this.writeLocks.set(key, next);
		try {
			return await next;
		} finally {
			if (this.writeLocks.get(key) === next) this.writeLocks.delete(key);
		}
	}
	async atomicWrite(path, data) {
		const tmp = `${path}.tmp.${randomUUID()}`;
		await writeFile(tmp, data);
		await rename(tmp, path);
	}
	async create(userId) {
		const id = randomUUID();
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const conv = {
			id,
			user_id: userId,
			title: "New conversation",
			created_at: now,
			updated_at: now,
			messages: []
		};
		await mkdir(this.userDir(userId), { recursive: true });
		await this.atomicWrite(this.convPath(userId, id), JSON.stringify(conv, null, 2));
		return conv;
	}
	async list(userId) {
		const dir = this.userDir(userId);
		let files;
		try {
			files = await readdir(dir);
		} catch {
			return [];
		}
		const convs = [];
		for (const file of files) {
			if (!file.endsWith(".json")) continue;
			try {
				const raw = await readFile(join(dir, file), "utf-8");
				const conv = JSON.parse(raw);
				convs.push({
					id: conv.id,
					title: conv.title,
					created_at: conv.created_at,
					updated_at: conv.updated_at
				});
			} catch {}
		}
		convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
		return convs;
	}
	async load(convId, userId) {
		try {
			const raw = await readFile(this.convPath(userId, convId), "utf-8");
			const conv = JSON.parse(raw);
			if (conv.user_id !== userId) return null;
			return conv;
		} catch {
			return null;
		}
	}
	async appendMessage(convId, userId, message) {
		await this.withLock(`${userId}/${convId}`, async () => {
			const conv = await this.load(convId, userId);
			if (!conv) return;
			conv.messages.push(message);
			conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
			await this.atomicWrite(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
		});
	}
	async delete(convId, userId) {
		await this.withLock(`${userId}/${convId}`, async () => {
			if (!await this.load(convId, userId)) return;
			try {
				await rm(this.convPath(userId, convId));
			} catch {}
		});
	}
	async rename(convId, userId, title) {
		await this.withLock(`${userId}/${convId}`, async () => {
			const conv = await this.load(convId, userId);
			if (!conv) return;
			conv.title = title;
			conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
			await this.atomicWrite(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
		});
	}
};
//#endregion
//#region extensions/homeassistant/src/channel.ts
/**
* Home Assistant Channel Plugin for OpenClaw.
*
* Uses the gateway's native WebSocket for real-time chat — no standalone
* server, no custom ports. The HA panel connects to the same gateway WSS
* endpoint as the OC control UI and calls gateway methods.
*/
const CHANNEL_ID = "homeassistant";
function getPluginConfig(cfg) {
	const full = cfg;
	const fromChannel = full.channels?.homeassistant;
	const fromPlugin = ((full.plugins?.entries)?.homeassistant)?.config;
	return fromChannel ?? fromPlugin ?? {};
}
function resolveAccount(cfg, _accountId) {
	const config = getPluginConfig(cfg);
	return {
		accountId: "default",
		url: config.url ?? "http://localhost:8123",
		token: config.token ?? "",
		secret: config.secret ?? "",
		admins: Array.isArray(config.admins) ? config.admins : typeof config.admins === "string" ? config.admins.split(",").map((s) => s.trim()).filter(Boolean) : []
	};
}
function isAdmin(userId, admins) {
	return admins.includes(userId);
}
let dispatchFn = null;
let transcribeFn = null;
let conversationStoreInstance = null;
function setHaDispatch(fn) {
	dispatchFn = fn;
}
function getHaDispatch() {
	return dispatchFn;
}
function setHaTranscribe(fn) {
	transcribeFn = fn;
}
function getHaTranscribe() {
	return transcribeFn;
}
/**
* Lazily create (and cache) the conversation store for the current module
* instance. The HTTP API (registerFull) and the legacy channel `start` hook may
* run in different plugin load instances (setup-runtime vs full); each calls
* this so its own instance has a valid store rather than depending on the other.
*/
function ensureConversationStore() {
	if (!conversationStoreInstance) conversationStoreInstance = new ConversationStore(join(homedir(), ".openclaw", "homeassistant", "conversations"));
	return conversationStoreInstance;
}
function createHomeAssistantPlugin() {
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
				order: 85
			},
			capabilities: {
				chatTypes: ["direct"],
				media: true,
				threads: false,
				reactions: false,
				edit: false,
				unsend: false,
				reply: false,
				effects: false,
				blockStreaming: false
			},
			reload: { configPrefixes: [`plugins.entries.${CHANNEL_ID}`, `channels.${CHANNEL_ID}`] },
			config: {
				listAccountIds: () => ["default"],
				resolveAccount: (cfg, accountId) => resolveAccount(cfg, accountId),
				inspectAccount: (cfg) => {
					const account = resolveAccount(cfg);
					return {
						enabled: Boolean(account.token) && Boolean(account.secret),
						configured: Boolean(account.token)
					};
				}
			},
			gateway: {
				startAccount: async (ctx) => {
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
					ensureConversationStore();
					log?.info?.("Home Assistant channel started (gateway methods)");
					return waitUntilAbort(abortSignal, () => {
						log?.info?.(`Stopping Home Assistant channel (account: ${accountId})`);
						conversationStoreInstance = null;
					});
				},
				stopAccount: async (ctx) => {
					ctx.log?.info?.(`Home Assistant account ${ctx.accountId} stopped`);
				}
			}
		},
		security: { dm: {
			channelKey: CHANNEL_ID,
			resolvePolicy: () => "open",
			resolveAllowFrom: () => [],
			defaultPolicy: "open",
			approveHint: "openclaw pairing approve homeassistant <userId>"
		} },
		outbound: {
			deliveryMode: "gateway",
			textChunkLimit: 4096,
			sendText: async () => {
				return {
					channel: CHANNEL_ID,
					messageId: `ha-${Date.now()}`,
					chatId: "gw"
				};
			},
			sendMedia: async () => {
				return {
					channel: CHANNEL_ID,
					messageId: `ha-${Date.now()}`,
					chatId: "gw"
				};
			}
		}
	});
}
const homeAssistantPlugin = createHomeAssistantPlugin();
//#endregion
//#region extensions/homeassistant/src/agent-routing.ts
/**
* Map an HA user to the agent whose memory their chat uses. Admin (owner) → "main"
* (unified cross-channel assistant); everyone else → "home-<normalized hass user id>"
* so each person gets an isolated, auto-provisioned memory store.
*/
function resolveHaAgentId(user) {
	if (user.is_admin) return "main";
	return `home-${normalizeAgentId(user.user_id || "anonymous")}`;
}
//#endregion
//#region extensions/homeassistant/src/dispatch.ts
async function runHaDispatch(params) {
	const { cfg, user, text, conversationId, onToken, onToolActivity, onDone, onError } = params;
	const agentId = resolveHaAgentId(user);
	const sessionKey = `ha:${user.user_id}:${conversationId}`;
	await dispatchInboundMessage({
		ctx: finalizeInboundContext({
			Body: text,
			BodyForAgent: text,
			BodyForCommands: text,
			RawBody: text,
			From: `ha:${user.user_id}`,
			To: `ha:${user.user_id}`,
			SessionKey: sessionKey,
			SenderName: user.user_name,
			SenderId: user.user_id,
			Provider: "homeassistant",
			Surface: "homeassistant",
			AgentId: agentId,
			OriginatingChannel: "homeassistant",
			OriginatingTo: `ha:${user.user_id}`,
			CommandAuthorized: user.is_admin
		}),
		cfg,
		dispatcher: createReplyDispatcher({
			...createChannelReplyPipeline({
				cfg,
				agentId,
				channel: "homeassistant"
			}),
			deliver: async (payload, info) => {
				if (info.kind === "tool") {
					onToolActivity?.();
					return;
				}
				if (payload.text) onDone(payload.text);
			},
			onError: (err) => {
				onError(String(err));
			}
		}),
		replyOptions: { onPartialReply: (() => {
			let lastSent = "";
			return async (payload) => {
				if (payload.text && payload.text.length > lastSent.length) {
					const delta = payload.text.slice(lastSent.length);
					lastSent = payload.text;
					onToken(delta);
				}
			};
		})() }
	});
}
//#endregion
//#region extensions/homeassistant/src/stream-hub.ts
const BUFFER_TTL_MS = 12e4;
const MAX_EVENTS_PER_CONV = 500;
const MAX_CONVERSATIONS = 200;
/**
* Fan-out hub for per-conversation SSE events with a short replay buffer. The buffer is what
* makes the panel robust: a late or RECONNECTING subscriber (EventSource reconnects on any
* network hiccup and resends `Last-Event-ID`) replays the events it missed — including the
* terminal `done` — instead of hanging on "thinking" forever. Replaying only events newer than
* the subscriber's last seen id keeps reconnects gap-free and duplicate-free.
*/
var StreamHub = class {
	constructor(now = Date.now) {
		this.subs = /* @__PURE__ */ new Map();
		this.buffers = /* @__PURE__ */ new Map();
		this.seq = 0;
		this.now = now;
	}
	/**
	* Subscribe to a conversation. Buffered events with `seq > lastEventId` (and within the TTL)
	* are replayed to the new listener first, then it receives live events. Pass the SSE
	* `Last-Event-ID` as `lastEventId` on reconnect; omit it for a fresh subscription.
	*/
	subscribe(conversationId, listener, lastEventId) {
		const buf = this.buffers.get(conversationId);
		if (buf) {
			const cutoff = this.now() - BUFFER_TTL_MS;
			const after = lastEventId ?? 0;
			for (const b of buf) if (b.at >= cutoff && b.seq > after) listener(b.event, b.seq);
		}
		let set = this.subs.get(conversationId);
		if (!set) {
			set = /* @__PURE__ */ new Set();
			this.subs.set(conversationId, set);
		}
		set.add(listener);
		return () => {
			const s = this.subs.get(conversationId);
			if (!s) return;
			s.delete(listener);
			if (s.size === 0) this.subs.delete(conversationId);
		};
	}
	publish(conversationId, event) {
		const seq = ++this.seq;
		this.appendBuffer(conversationId, event, seq);
		const set = this.subs.get(conversationId);
		if (!set) return;
		const snapshot = new Set(set);
		for (const l of snapshot) l(event, seq);
	}
	appendBuffer(conversationId, event, seq) {
		const at = this.now();
		let buf = this.buffers.get(conversationId);
		if (!buf) {
			if (this.buffers.size >= MAX_CONVERSATIONS) {
				const oldest = this.buffers.keys().next().value;
				if (oldest !== void 0) this.buffers.delete(oldest);
			}
			buf = [];
			this.buffers.set(conversationId, buf);
		}
		buf.push({
			event,
			seq,
			at
		});
		const cutoff = at - BUFFER_TTL_MS;
		while (buf.length > MAX_EVENTS_PER_CONV || buf.length > 0 && buf[0].at < cutoff) buf.shift();
	}
};
//#endregion
//#region extensions/homeassistant/src/http-api.ts
const MAX_BODY_BYTES = 8 * 1024 * 1024;
var BodyTooLargeError = class extends Error {};
const SAFE_ID = /^[A-Za-z0-9_-]+$/;
function isSafeId(value) {
	return SAFE_ID.test(value);
}
function cors(res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "content-type, x-openclaw-secret");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}
function json(res, status, body) {
	cors(res);
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify(body));
}
async function readBody(req) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		total += buf.length;
		if (total > MAX_BODY_BYTES) {
			req.destroy();
			throw new BodyTooLargeError();
		}
		chunks.push(buf);
	}
	const raw = Buffer.concat(chunks).toString("utf-8");
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
		return {};
	} catch {
		return {};
	}
}
function safeEqual(a, b) {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}
function authOk(secret, headerValue, bodyValue) {
	if (!secret) return false;
	const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
	if (typeof fromHeader === "string" && safeEqual(fromHeader, secret)) return true;
	if (typeof bodyValue === "string" && safeEqual(bodyValue, secret)) return true;
	return false;
}
async function handleStream(req, res, deps) {
	const url = new URL(req.url ?? "/", "http://localhost");
	const secret = deps.getSecret();
	const headerSecret = req.headers["x-openclaw-secret"];
	if (!authOk(secret, headerSecret, url.searchParams.get("secret"))) {
		json(res, 401, { error: "Unauthorized" });
		return;
	}
	const conversationId = url.searchParams.get("conversation_id") ?? "";
	const lastEventIdHeader = req.headers["last-event-id"];
	const lastEventIdRaw = Array.isArray(lastEventIdHeader) ? lastEventIdHeader[0] : lastEventIdHeader;
	const lastEventId = lastEventIdRaw ? Number.parseInt(lastEventIdRaw, 10) : NaN;
	cors(res);
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.write(": connected\n\n");
	const unsub = deps.hub.subscribe(conversationId, (event, seq) => {
		res.write(`id: ${seq}\ndata: ${JSON.stringify({
			...event,
			conversation_id: conversationId
		})}\n\n`);
	}, Number.isFinite(lastEventId) ? lastEventId : void 0);
	const pingInterval = setInterval(() => {
		res.write(": ping\n\n");
	}, 25e3);
	req.on("close", () => {
		clearInterval(pingInterval);
		unsub();
	});
}
async function handleSend(req, res, deps) {
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
	let conversationId = typeof body.conversation_id === "string" ? body.conversation_id : void 0;
	let newConversation = false;
	if (!isSafeId(user.user_id) || conversationId !== void 0 && !isSafeId(conversationId)) {
		json(res, 400, { error: "Invalid id" });
		return;
	}
	if (!conversationId) {
		conversationId = (await store.create(user.user_id)).id;
		newConversation = true;
	}
	const convId = conversationId;
	const userMessage = {
		role: "user",
		text,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	};
	await store.appendMessage(convId, user.user_id, userMessage);
	json(res, 200, {
		conversation_id: convId,
		new_conversation: newConversation
	});
	(async () => {
		let accumulated = "";
		try {
			await dispatch({
				cfg: deps.getCfg(),
				user,
				text,
				conversationId: convId,
				onToken: (token) => {
					accumulated += token;
					deps.hub.publish(convId, {
						type: "token",
						token
					});
				},
				onToolActivity: () => {
					deps.hub.publish(convId, { type: "tool" });
				},
				onDone: (fullText) => {
					deps.hub.publish(convId, {
						type: "done",
						full_text: fullText
					});
				},
				onError: (error) => {
					deps.hub.publish(convId, {
						type: "error",
						error
					});
				},
				signal: new AbortController().signal
			});
			const assistantMessage = {
				role: "assistant",
				text: accumulated,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
			await store.appendMessage(convId, user.user_id, assistantMessage);
			const conv = await store.load(convId, user.user_id);
			if (conv && conv.title === "New conversation") {
				const title = generateTitle(text);
				await store.rename(convId, user.user_id, title);
				deps.hub.publish(convId, {
					type: "title",
					title
				});
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			deps.hub.publish(convId, {
				type: "error",
				error: message
			});
		}
	})();
}
async function handleConversations(req, res, deps) {
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
	if (!isSafeId(userId)) {
		json(res, 400, { error: "Invalid user_id" });
		return;
	}
	if (action === "load" || action === "delete" || action === "rename") {
		if (!isSafeId(typeof body.conversation_id === "string" ? body.conversation_id : "")) {
			json(res, 400, { error: "Invalid conversation_id" });
			return;
		}
	}
	switch (action) {
		case "list":
			json(res, 200, { conversations: (await store.list(userId)).map((c) => ({
				id: c.id,
				title: c.title,
				updated_at: c.updated_at
			})) });
			break;
		case "create": {
			const conv = await store.create(userId);
			json(res, 200, {
				id: conv.id,
				title: conv.title
			});
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
					ts: m.timestamp
				}))
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
		default: json(res, 400, { error: `Unknown action: ${action}` });
	}
}
async function handleTranscribe(req, res, deps) {
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
		const text = (await transcribe({
			audioData: Buffer.from(audioBase64, "base64"),
			mime
		})).text ?? "";
		const isGibberish = text.length > 0 && text.length < 2;
		json(res, 200, {
			text: isGibberish ? "" : text,
			retry: isGibberish || !text
		});
	} catch (err) {
		json(res, 500, { error: String(err) });
	}
}
function generateTitle(text) {
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (cleaned.length <= 40) return cleaned;
	const truncated = cleaned.slice(0, 40);
	const lastSpace = truncated.lastIndexOf(" ");
	return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "...";
}
const BASE = "/api/homeassistant";
function createHaHttpApi(deps) {
	const hub = deps.hub;
	async function handle(req, res) {
		const path = (req.url ?? "").split("?")[0];
		if (!path.startsWith(BASE)) return false;
		const sub = path.slice(18);
		if (req.method === "OPTIONS") {
			cors(res);
			res.statusCode = 204;
			res.end();
			return true;
		}
		try {
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
		} catch (err) {
			if (!res.headersSent) json(res, err instanceof BodyTooLargeError ? 413 : 500, { error: err instanceof BodyTooLargeError ? "Payload too large" : "Internal error" });
			return true;
		}
		return false;
	}
	return {
		handle,
		hub
	};
}
//#endregion
//#region extensions/homeassistant/src/memory-guidance.ts
/** Capture + suggestion guidance injected into Home Assistant agent runs. */
const HA_MEMORY_GUIDANCE = [
	"## Remembering & suggesting (Home Assistant)",
	"",
	"When the user shares something durable — a preference, recipe, personal fact, standing",
	"instruction, recurring concern, or music/playlist they want — call the `remember` tool with",
	"a one-sentence distilled fact, then briefly acknowledge it (e.g. \"Got it — I'll remember that\").",
	"Be liberal: if unsure whether something is worth keeping, remember it. Do not remember transient",
	"commands (\"turn on the light\"), things you already know, or facts already given to you in this",
	"prompt (the household facts below are not yours to re-save). If the user corrects a remembered",
	"fact, call `remember` again with the correction.",
	"",
	"Proactively use what you remember: when relevant, suggest recipes they've liked, playlists they've",
	"enjoyed, or revisit prior concerns — without being asked."
].join("\n");
/** Persona + household context for the Home Assistant household assistant. */
const HA_PERSONA = [
	"## Who you are",
	"",
	"You're the household assistant for the Nilsson family in Nordstrand, Oslo. This identity is",
	"settled — you do NOT need a personal name and must never pester anyone to name you, never ask",
	"\"who am I\". Just be the house assistant. Your style:",
	"",
	"- Cynical and dry — funny with it, not a perky robot. Keep the attitude friendly, never mean.",
	"- Concise. Short answers, cut the padding.",
	"- Prefer bullet lists and clean formatting over walls of text.",
	"- Ask a follow-up only when it genuinely helps — don't interrogate.",
	"- You can read and control the home via the `ha_get_states` and `ha_call_service` tools.",
	"",
	"Household facts you can rely on:",
	"",
	"- Home: Nordstrand, Oslo.",
	"- Birthdays: Håvard (the owner) — 16 Feb 1990; Nora (his wife) — 6 Apr 1990; Matheo (their son) — 23 Oct 2023."
].join("\n");
/** HA runs are identified by the homeassistant message provider. */
function shouldInjectHaGuidance(ctx) {
	return ctx.messageProvider === "homeassistant";
}
/**
* Build the context to prepend on a Home Assistant run: the household persona plus memory
* guidance. Injected for EVERY HA run (including the owner's `main` agent) so the assistant
* has a settled identity on HA and never badgers the user for a name. This is scoped to HA
* (`messageProvider`), so the owner's other channels (e.g. WhatsApp) are unaffected.
*/
function buildHaPrependContext(ctx) {
	if (!shouldInjectHaGuidance(ctx)) return;
	return [HA_PERSONA, HA_MEMORY_GUIDANCE].join("\n\n");
}
//#endregion
//#region extensions/homeassistant/src/remember.ts
/** Format one appendable memory bullet for memory/YYYY-MM-DD.md. */
function formatMemoryLine(params) {
	const fact = params.fact.trim();
	const category = params.category?.trim();
	return `- ${fact}${category ? ` _(${category})_` : ""}\n`;
}
/** YYYY-MM-DD in local time (intuitive for a home user; matches the daily-file convention). */
function localDateStamp(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
/**
* Append a distilled memory line to <workspaceDir>/memory/<dateStamp>.md (append-only,
* canonical daily filename). memory-core auto-indexes any *.md under memory/. Returns the
* written line (without trailing newline) so the caller can acknowledge it.
*/
async function appendMemoryLine(params) {
	const memoryDir = join(params.workspaceDir, "memory");
	await mkdir(memoryDir, { recursive: true });
	const line = formatMemoryLine({
		fact: params.fact,
		category: params.category
	});
	await appendFile(join(memoryDir, `${params.dateStamp}.md`), line, "utf-8");
	return line.trimEnd();
}
//#endregion
//#region extensions/homeassistant/index.ts
function haClient(config) {
	const base = (config.url ?? "http://localhost:8123").replace(/\/$/, "");
	const headers = {
		Authorization: `Bearer ${config.token}`,
		"Content-Type": "application/json"
	};
	async function request(method, path, body) {
		const res = await fetch(`${base}${path}`, {
			method,
			headers,
			body: body !== void 0 ? JSON.stringify(body) : void 0
		});
		if (!res.ok) {
			const text = await res.text().catch(() => res.statusText);
			throw new Error(`HA API error ${res.status}: ${text}`);
		}
		return res.json();
	}
	return { request };
}
/**
* Resolve a user identity from a request body.
* Auth is already verified (secret checked by handleSend/handleConversations/handleTranscribe)
* before this is called; we just map the body fields to an HaUserIdentity.
*/
function resolveUser(body, cfg) {
	const userId = typeof body.user_id === "string" ? body.user_id : "anonymous";
	return {
		user_id: userId,
		user_name: typeof body.user_name === "string" ? body.user_name : userId,
		is_admin: isAdmin(userId, resolveAccount(cfg).admins)
	};
}
function registerFull(api) {
	const cfg = api.pluginConfig;
	const ha = haClient(cfg);
	setHaDispatch(runHaDispatch);
	api.on("before_prompt_build", (_event, ctx) => {
		const prependContext = buildHaPrependContext(ctx);
		return prependContext ? { prependContext } : void 0;
	});
	setHaTranscribe(async ({ audioData, mime }) => {
		const { writeFile, unlink } = await import("node:fs/promises");
		const { join } = await import("node:path");
		const { randomUUID } = await import("node:crypto");
		const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "m4a" : mime.includes("wav") ? "wav" : mime.includes("aac") ? "aac" : "ogg";
		const tmpPath = join((await import("node:os")).tmpdir(), `openclaw-ha-audio-${randomUUID()}.${ext}`);
		try {
			await writeFile(tmpPath, audioData);
			return { text: (await api.runtime.mediaUnderstanding.transcribeAudioFile({
				filePath: tmpPath,
				cfg: api.config,
				mime
			})).text?.trim() || void 0 };
		} finally {
			await unlink(tmpPath).catch(() => {});
		}
	});
	const store = ensureConversationStore();
	const haApi = createHaHttpApi({
		hub: new StreamHub(),
		getStore: () => store,
		getDispatch: () => getHaDispatch(),
		getSecret: () => resolveAccount(api.config).secret,
		getCfg: () => api.config,
		getTranscribe: () => getHaTranscribe(),
		resolveUser: (body) => resolveUser(body, api.config)
	});
	api.registerHttpRoute({
		path: "/api/homeassistant",
		match: "prefix",
		auth: "plugin",
		handler: (req, res) => haApi.handle(req, res)
	});
	api.registerTool({
		name: "ha_get_states",
		label: "Get States",
		description: "Get Home Assistant entity states. Pass an entity_id for ONE entity's full state (all attributes). Omit it for a COMPACT summary of all entities (id, state, name, unit) — then fetch a specific entity_id if you need its full attributes.",
		parameters: Type.Object({ entity_id: Type.Optional(Type.String({ description: "Entity ID, e.g. light.living_room" })) }),
		async execute(_id, params) {
			const { entity_id } = params;
			if (entity_id) {
				const data = await ha.request("GET", `/api/states/${entity_id}`);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}],
					details: {}
				};
			}
			const compact = (await ha.request("GET", "/api/states")).map((e) => ({
				entity_id: e.entity_id,
				state: e.state,
				...e.attributes?.friendly_name ? { name: e.attributes.friendly_name } : {},
				...e.attributes?.unit_of_measurement ? { unit: e.attributes.unit_of_measurement } : {}
			}));
			return {
				content: [{
					type: "text",
					text: JSON.stringify(compact, null, 2)
				}],
				details: {}
			};
		}
	});
	api.registerTool({
		name: "ha_call_service",
		label: "Call Service",
		description: "Call a Home Assistant service. Examples: domain=light service=turn_on, domain=switch service=toggle, domain=climate service=set_temperature. Pass service_data for extra fields (brightness, temperature, etc).",
		parameters: Type.Object({
			domain: Type.String({ description: "Service domain, e.g. light, switch, climate" }),
			service: Type.String({ description: "Service name, e.g. turn_on, turn_off, toggle" }),
			service_data: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Extra fields, e.g. { entity_id: 'light.kitchen', brightness: 128 }" }))
		}),
		async execute(_id, params) {
			const { domain, service, service_data } = params;
			const data = await ha.request("POST", `/api/services/${domain}/${service}`, service_data ?? {});
			return {
				content: [{
					type: "text",
					text: JSON.stringify(data, null, 2)
				}],
				details: {}
			};
		}
	});
	api.registerTool({
		name: "ha_get_history",
		label: "Get History",
		description: "Get state change history for one or more entities over a time range.",
		parameters: Type.Object({
			entity_ids: Type.Array(Type.String(), { description: "List of entity IDs to query" }),
			hours_back: Type.Optional(Type.Number({
				description: "How many hours of history to fetch (default 24)",
				default: 24
			}))
		}),
		async execute(_id, params) {
			const { entity_ids, hours_back } = params;
			const hours = hours_back ?? 24;
			const start = (/* @__PURE__ */ new Date(Date.now() - hours * 60 * 60 * 1e3)).toISOString();
			const ids = entity_ids.join(",");
			const data = await ha.request("GET", `/api/history/period/${start}?filter_entity_id=${ids}&minimal_response`);
			return {
				content: [{
					type: "text",
					text: JSON.stringify(data, null, 2)
				}],
				details: {}
			};
		}
	}, { optional: true });
	api.registerTool({
		name: "ha_fire_event",
		label: "Fire Event",
		description: "Fire a custom Home Assistant event.",
		parameters: Type.Object({
			event_type: Type.String({ description: "Event type to fire" }),
			event_data: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Payload to attach to the event" }))
		}),
		async execute(_id, params) {
			const { event_type, event_data } = params;
			const data = await ha.request("POST", `/api/events/${event_type}`, event_data ?? {});
			return {
				content: [{
					type: "text",
					text: JSON.stringify(data, null, 2)
				}],
				details: {}
			};
		}
	}, { optional: true });
	api.registerTool((toolCtx) => ({
		name: "remember",
		label: "Remember",
		description: "Save a durable fact about the current user to long-term memory: a preference, recipe, personal fact, standing instruction, recurring concern, or media/playlist they like. Call this when the user shares something worth remembering, then briefly acknowledge it.",
		parameters: Type.Object({
			fact: Type.String({ description: "The distilled fact to remember, one sentence." }),
			category: Type.Optional(Type.String({ description: "Optional tag: preference, recipe, fact, instruction, concern, or media." }))
		}),
		async execute(_id, params) {
			const { fact, category } = params;
			if (!fact?.trim()) return {
				content: [{
					type: "text",
					text: "No fact provided."
				}],
				details: {}
			};
			const cfg = toolCtx.getRuntimeConfig?.() ?? toolCtx.runtimeConfig ?? toolCtx.config;
			const workspaceDir = toolCtx.workspaceDir ?? (cfg && toolCtx.agentId ? resolveAgentWorkspaceDir(cfg, toolCtx.agentId) : void 0);
			if (!workspaceDir) return {
				content: [{
					type: "text",
					text: "Could not resolve memory location."
				}],
				details: {}
			};
			return {
				content: [{
					type: "text",
					text: `Remembered: ${await appendMemoryLine({
						workspaceDir,
						dateStamp: localDateStamp(/* @__PURE__ */ new Date()),
						fact,
						category
					})}`
				}],
				details: {}
			};
		}
	}), { names: ["remember"] });
}
var homeassistant_default = defineBundledChannelEntry({
	id: "homeassistant",
	name: "Home Assistant",
	description: "Home Assistant channel and tools — chat interface with WebSocket streaming and REST API control",
	importMetaUrl: import.meta.url,
	plugin: {
		specifier: "./src/channel.js",
		exportName: "homeAssistantPlugin"
	},
	registerFull
});
//#endregion
export { homeassistant_default as default, homeAssistantPlugin };
