import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-mnp54Vah.js";
import "./agent-scope-Cs4iFI2N.js";
import { i as buildAgentMainSessionKey, u as normalizeAgentId } from "./session-key-B_NoIfpX.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-KLbWcRY1.js";
import { i as getRuntimeConfig } from "./io-ET-UkTrJ.js";
import { s as loadManifestMetadataSnapshot } from "./manifest-contract-eligibility-bKGwmJwj.js";
import { i as normalizeMessageChannel } from "./message-channel-normalize-DhphqsX3.js";
import "./message-channel-B3OprsLe.js";
import { c as parseModelRef, i as modelKey } from "./model-selection-normalize-CaX-aqxJ.js";
import { c as resolveDefaultModelForAgent } from "./model-selection-CK2eTa-W.js";
import { n as createModelVisibilityPolicy } from "./model-visibility-policy-uDsoDE7Q.js";
import { a as getHeader } from "./http-auth-utils-DWHDh7y-.js";
import { t as loadGatewayModelCatalog } from "./server-model-catalog-BtvkFETQ.js";
import { randomUUID } from "node:crypto";
//#region src/gateway/http-utils.ts
const OPENCLAW_MODEL_ID = "openclaw";
/** Default OpenAI-compatible model alias that targets the default OpenClaw agent. */
const OPENCLAW_DEFAULT_MODEL_ID = "openclaw/default";
function resolveAgentIdFromHeader(req) {
	const raw = normalizeOptionalString(getHeader(req, "x-openclaw-agent-id")) || normalizeOptionalString(getHeader(req, "x-openclaw-agent")) || "";
	if (!raw) return;
	return normalizeAgentId(raw);
}
/** Resolves the target agent encoded by an OpenAI-compatible model id. */
function resolveAgentIdFromModel(model, cfg = getRuntimeConfig()) {
	const raw = model?.trim();
	if (!raw) return;
	const lowered = normalizeLowercaseStringOrEmpty(raw);
	if (lowered === "openclaw" || lowered === "openclaw/default") return resolveDefaultAgentId(cfg);
	const agentId = (raw.match(/^openclaw[:/](?<agentId>[a-z0-9][a-z0-9_-]{0,63})$/i) ?? raw.match(/^agent:(?<agentId>[a-z0-9][a-z0-9_-]{0,63})$/i))?.groups?.agentId;
	if (!agentId) return;
	return normalizeAgentId(agentId);
}
/** Validates and resolves the `x-openclaw-model` override for OpenAI-compatible requests. */
async function resolveOpenAiCompatModelOverride(params) {
	const requestModel = params.model?.trim();
	if (requestModel && !resolveAgentIdFromModel(requestModel)) return { errorMessage: "Invalid `model`. Use `openclaw` or `openclaw/<agentId>`." };
	const raw = getHeader(params.req, "x-openclaw-model")?.trim();
	if (!raw) return {};
	const cfg = getRuntimeConfig();
	const defaultProvider = resolveDefaultModelForAgent({
		cfg,
		agentId: params.agentId
	}).provider;
	const modelManifestContext = { manifestPlugins: loadManifestMetadataSnapshot({
		config: cfg,
		env: process.env
	}).plugins };
	const parsed = parseModelRef(raw, defaultProvider, {
		allowManifestNormalization: true,
		allowPluginNormalization: true,
		...modelManifestContext
	});
	if (!parsed) return { errorMessage: "Invalid `x-openclaw-model`." };
	const policy = createModelVisibilityPolicy({
		cfg,
		catalog: await loadGatewayModelCatalog(),
		defaultProvider,
		agentId: params.agentId,
		allowManifestNormalization: true,
		allowPluginNormalization: true,
		...modelManifestContext
	});
	const normalized = modelKey(parsed.provider, parsed.model);
	if (!policy.allowsKey(normalized)) return { errorMessage: `Model '${normalized}' is not allowed for agent '${params.agentId}'.` };
	return { modelOverride: raw };
}
/** Resolves the request agent from headers, model alias, or the configured default. */
function resolveAgentIdForRequest(params) {
	const cfg = getRuntimeConfig();
	const fromHeader = resolveAgentIdFromHeader(params.req);
	if (fromHeader) return fromHeader;
	return resolveAgentIdFromModel(params.model, cfg) ?? resolveDefaultAgentId(cfg);
}
function resolveSessionKey(params) {
	const explicit = getHeader(params.req, "x-openclaw-session-key")?.trim();
	if (explicit) return explicit;
	const user = params.user?.trim();
	const mainKey = user ? `${params.prefix}-user:${user}` : `${params.prefix}:${randomUUID()}`;
	return buildAgentMainSessionKey({
		agentId: params.agentId,
		mainKey
	});
}
/** Resolves gateway agent/session/channel context for OpenAI-compatible handlers. */
function resolveGatewayRequestContext(params) {
	const agentId = resolveAgentIdForRequest({
		req: params.req,
		model: params.model
	});
	return {
		agentId,
		sessionKey: resolveSessionKey({
			req: params.req,
			agentId,
			user: params.user,
			prefix: params.sessionPrefix
		}),
		messageChannel: params.useMessageChannelHeader ? normalizeMessageChannel(getHeader(params.req, "x-openclaw-message-channel")) ?? params.defaultMessageChannel : params.defaultMessageChannel
	};
}
//#endregion
export { resolveGatewayRequestContext as a, resolveAgentIdFromModel as i, OPENCLAW_MODEL_ID as n, resolveOpenAiCompatModelOverride as o, resolveAgentIdForRequest as r, OPENCLAW_DEFAULT_MODEL_ID as t };
