import { c as normalizeOptionalString } from "./string-coerce-mnp54Vah.js";
import { _ as parseStrictFiniteNumber, j as resolveTimerTimeoutMs } from "./number-coercion-CJQ8TR--.js";
import "./number-coercion-Z7n6tXLk.js";
import "./gateway-startup-plugin-ids-BmZuZO20.js";
import { i as buildModelAliasIndex, y as resolveModelRefFromString } from "./model-selection-shared-CRbMpoUU.js";
import { c as resolveDefaultModelForAgent } from "./model-selection-CK2eTa-W.js";
import { o as requireApiKey } from "./model-auth-runtime-shared-ZF0jyHxm.js";
import { n as completeSimple } from "./stream-Dc9UFG6J.js";
import { a as getApiKeyForModel } from "./model-auth-qfP2FUMj.js";
import "./provider-http-errors-CMDQEuBQ.js";
import { n as resolveModelAsync } from "./model-6ufXQ6Ob.js";
import { t as prepareModelForSimpleCompletion } from "./simple-completion-transport-BCNqsmFs.js";
import "./directives-Dw73ceN6.js";
//#region src/tts/tts-core.ts
function resolveDefaultSummarizeTextDeps() {
	return {
		completeSimple,
		getApiKeyForModel,
		prepareModelForSimpleCompletion,
		requireApiKey,
		resolveModelAsync
	};
}
function resolveSummaryModelRef(cfg, config) {
	const defaultRef = resolveDefaultModelForAgent({ cfg });
	const override = normalizeOptionalString(config.summaryModel);
	if (!override) return {
		ref: defaultRef,
		source: "default"
	};
	const aliasIndex = buildModelAliasIndex({
		cfg,
		defaultProvider: defaultRef.provider
	});
	const resolved = resolveModelRefFromString({
		raw: override,
		defaultProvider: defaultRef.provider,
		aliasIndex
	});
	if (!resolved) return {
		ref: defaultRef,
		source: "default"
	};
	return {
		ref: resolved.ref,
		source: "summaryModel"
	};
}
function isTextContentBlock(block) {
	return block.type === "text";
}
/** Summarize long text before synthesis using the configured summary model. */
async function summarizeText(params, deps = resolveDefaultSummarizeTextDeps()) {
	const { text, targetLength, cfg, config, timeoutMs } = params;
	if (targetLength < 100 || targetLength > 1e4) throw new Error(`Invalid targetLength: ${targetLength}`);
	const startTime = Date.now();
	const { ref } = resolveSummaryModelRef(cfg, config);
	const resolved = await deps.resolveModelAsync(ref.provider, ref.model, void 0, cfg);
	if (!resolved.model) throw new Error(resolved.error ?? `Unknown summary model: ${ref.provider}/${ref.model}`);
	const completionModel = deps.prepareModelForSimpleCompletion({
		model: resolved.model,
		cfg
	});
	const apiKey = deps.requireApiKey(await deps.getApiKeyForModel({
		model: completionModel,
		cfg
	}), ref.provider);
	try {
		const controller = new AbortController();
		const resolvedTimeoutMs = resolveTimerTimeoutMs(timeoutMs, 1);
		const timeout = setTimeout(() => controller.abort(), resolvedTimeoutMs);
		try {
			const summary = (await deps.completeSimple(completionModel, { messages: [{
				role: "user",
				content: `You are an assistant that summarizes texts concisely while keeping the most important information. Summarize the text to approximately ${targetLength} characters. Maintain the original tone and style. Reply only with the summary, without additional explanations.\n\n<text_to_summarize>\n${text}\n</text_to_summarize>`,
				timestamp: Date.now()
			}] }, {
				apiKey,
				maxTokens: Math.ceil(targetLength / 2),
				temperature: .3,
				signal: controller.signal
			})).content.filter(isTextContentBlock).map((block) => block.text.trim()).filter(Boolean).join(" ").trim();
			if (!summary) throw new Error("No summary returned");
			return {
				summary,
				latencyMs: Date.now() - startTime,
				inputLength: text.length,
				outputLength: summary.length
			};
		} finally {
			clearTimeout(timeout);
		}
	} catch (err) {
		if (err.name === "AbortError") throw new Error("Summarization timed out", { cause: err });
		throw err;
	}
}
//#endregion
//#region src/tts/directive-number.ts
function isInDirectiveNumberRange(value, range) {
	if (range.min !== void 0 && (range.minExclusive ? value <= range.min : value < range.min)) return false;
	if (range.max !== void 0 && (range.maxExclusive ? value >= range.max : value > range.max)) return false;
	return true;
}
/** Parse a numeric speech directive token and return provider overrides when policy allows it. */
function parseSpeechDirectiveNumberOverride(params) {
	if (!params.ctx.policy.allowVoiceSettings) return { handled: true };
	const value = parseStrictFiniteNumber(params.ctx.value);
	if (value === void 0 || !isInDirectiveNumberRange(value, params.range)) return {
		handled: true,
		warnings: [params.warning(params.ctx.value)]
	};
	const nextOverride = { [params.overrideKey]: value };
	return {
		handled: true,
		overrides: params.mergeCurrentOverrides ? {
			...params.ctx.currentOverrides,
			...nextOverride
		} : nextOverride
	};
}
//#endregion
export { summarizeText as n, parseSpeechDirectiveNumberOverride as t };
