import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { t as createLocalEmbeddingProvider } from "../../embeddings-C9SBNXgr.js";
import "../../memory-core-host-engine-embeddings-CEkYLYIk.js";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
//#region extensions/llama-cpp/src/embedding-provider.ts
const LLAMA_CPP_EMBEDDING_PROVIDER_ID = "local";
const DEFAULT_LLAMA_CPP_EMBEDDING_MODEL = "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
function normalizeOptionalString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function readLocalOptions(options) {
	return options.local ?? {};
}
function textFromEmbeddingInput(input) {
	return typeof input === "string" ? input : input.text;
}
function toMemoryEmbeddingInput(input) {
	return typeof input === "string" ? { text: input } : input;
}
function isNodeLlamaCppMissing(err) {
	if (!(err instanceof Error)) return false;
	return err.code === "ERR_MODULE_NOT_FOUND" && err.message.includes("node-llama-cpp");
}
function formatErrorMessage(err) {
	if (err instanceof Error) return err.message;
	return String(err);
}
function formatLlamaCppSetupError(err) {
	const detail = formatErrorMessage(err);
	const missing = isNodeLlamaCppMissing(err);
	return [
		"Local llama.cpp embeddings unavailable.",
		missing ? "Reason: node-llama-cpp is missing or failed to install." : detail ? `Reason: ${detail}` : void 0,
		missing && detail ? `Detail: ${detail}` : null,
		"To enable local GGUF embeddings:",
		"1) Install the official provider plugin: openclaw plugins install @openclaw/llama-cpp-provider",
		"2) Use Node 24 for native installs/updates.",
		"3) If you use pnpm from source: pnpm approve-builds, then pnpm rebuild node-llama-cpp.",
		"Or set agents.defaults.memorySearch.provider to a remote embedding provider such as \"openai\", \"ollama\", \"lmstudio\", or \"voyage\"."
	].filter(Boolean).join("\n");
}
const requireFromPlugin = createRequire(import.meta.url);
function resolveNodeLlamaCppImportUrl() {
	return pathToFileURL(requireFromPlugin.resolve("node-llama-cpp")).href;
}
function adaptMemoryEmbeddingProvider(provider) {
	return {
		id: LLAMA_CPP_EMBEDDING_PROVIDER_ID,
		model: provider.model,
		maxInputTokens: provider.maxInputTokens,
		embed: async (input, callOptions) => await provider.embedQuery(textFromEmbeddingInput(input), { signal: callOptions?.signal }),
		embedBatch: async (inputs, callOptions) => {
			if (provider.embedBatchInputs) return await provider.embedBatchInputs(inputs.map(toMemoryEmbeddingInput), { signal: callOptions?.signal });
			return await provider.embedBatch(inputs.map(textFromEmbeddingInput), { signal: callOptions?.signal });
		},
		close: provider.close
	};
}
async function createLlamaCppEmbeddingProvider(options, runtimeOptions = {}) {
	const result = await createLlamaCppMemoryEmbeddingProvider(buildMemoryCreateOptions(options, options.dimensions), runtimeOptions);
	if (!result.provider) throw new Error("llama.cpp local embedding provider was unavailable");
	return adaptMemoryEmbeddingProvider(result.provider);
}
async function createLlamaCppMemoryEmbeddingProvider(options, runtimeOptions = {}) {
	const provider = await createLocalEmbeddingProvider(buildMemoryCreateOptions(options, options.outputDimensionality), { nodeLlamaCppImportUrl: runtimeOptions.nodeLlamaCppImportUrl ?? resolveNodeLlamaCppImportUrl() });
	return {
		provider,
		runtime: createLlamaCppEmbeddingProviderRuntime(provider)
	};
}
function buildMemoryCreateOptions(options, outputDimensionality) {
	const local = readLocalOptions(options);
	const modelPath = normalizeOptionalString(local.modelPath) || "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
	return {
		config: options.config,
		agentDir: options.agentDir,
		provider: LLAMA_CPP_EMBEDDING_PROVIDER_ID,
		fallback: "none",
		remote: options.remote,
		model: modelPath,
		inputType: options.inputType,
		queryInputType: options.queryInputType,
		documentInputType: options.documentInputType,
		local: {
			...local,
			modelPath
		},
		outputDimensionality
	};
}
function createLlamaCppEmbeddingProviderRuntime(provider) {
	return {
		id: LLAMA_CPP_EMBEDDING_PROVIDER_ID,
		inlineQueryTimeoutMs: 5 * 6e4,
		inlineBatchTimeoutMs: 10 * 6e4,
		cacheKeyData: {
			provider: LLAMA_CPP_EMBEDDING_PROVIDER_ID,
			model: provider.model
		}
	};
}
const llamaCppEmbeddingProviderAdapter = {
	id: LLAMA_CPP_EMBEDDING_PROVIDER_ID,
	defaultModel: DEFAULT_LLAMA_CPP_EMBEDDING_MODEL,
	transport: "local",
	formatSetupError: formatLlamaCppSetupError,
	create: async (options) => {
		const provider = await createLlamaCppEmbeddingProvider(options);
		return {
			provider,
			runtime: createLlamaCppEmbeddingProviderRuntime(provider)
		};
	}
};
//#endregion
//#region extensions/llama-cpp/index.ts
var llama_cpp_default = definePluginEntry({
	id: "llama-cpp",
	name: "llama.cpp Provider",
	description: "Local GGUF embeddings through node-llama-cpp",
	register(api) {
		api.registerEmbeddingProvider(llamaCppEmbeddingProviderAdapter);
	}
});
//#endregion
export { llama_cpp_default as default };
