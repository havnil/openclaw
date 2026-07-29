import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { r as resolvePluginConfigObject } from "../../plugin-config-runtime-DFn-Ut8j.js";
import { n as buildProviderToolCompatFamilyHooks } from "../../provider-tools-VmwDm8UA.js";
import { t as buildOpenAIImageGenerationProvider } from "../../image-generation-provider-ojfX5io-.js";
import { t as openaiMediaUnderstandingProvider } from "../../media-understanding-provider-7EguOawd.js";
import { t as openAiMemoryEmbeddingProviderAdapter } from "../../memory-embedding-adapter-BGCn6Pn7.js";
import { i as buildOpenAIProvider } from "../../openai-provider-DrxHmGG-.js";
import { a as resolveOpenAISystemPromptContribution, i as resolveOpenAIPromptOverlayMode } from "../../prompt-overlay-DKPzgwox.js";
import { t as buildOpenAIRealtimeTranscriptionProvider } from "../../realtime-transcription-provider-BFAbPdV5.js";
import { t as buildOpenAIRealtimeVoiceProvider } from "../../realtime-voice-provider-DW4C29eb.js";
import { t as buildOpenAISpeechProvider } from "../../speech-provider-DDOJ1ek7.js";
import { t as buildOpenAIVideoGenerationProvider } from "../../video-generation-provider-CBjZBX5h.js";
//#region extensions/openai/index.ts
var openai_default = definePluginEntry({
	id: "openai",
	name: "OpenAI Provider",
	description: "Bundled OpenAI provider plugins",
	register(api) {
		const openAIToolCompatHooks = buildProviderToolCompatFamilyHooks("openai");
		const buildProviderWithPromptContribution = (provider) => ({
			...provider,
			...openAIToolCompatHooks,
			resolveSystemPromptContribution: (ctx) => {
				const pluginConfig = resolvePluginConfigObject(ctx.config, "openai") ?? (ctx.config ? void 0 : api.pluginConfig);
				return resolveOpenAISystemPromptContribution({
					config: ctx.config,
					legacyPluginConfig: pluginConfig,
					mode: resolveOpenAIPromptOverlayMode(pluginConfig),
					modelProviderId: provider.id,
					modelId: ctx.modelId,
					trigger: ctx.trigger
				});
			}
		});
		api.registerProvider(buildProviderWithPromptContribution(buildOpenAIProvider()));
		api.registerMemoryEmbeddingProvider(openAiMemoryEmbeddingProviderAdapter);
		api.registerImageGenerationProvider(buildOpenAIImageGenerationProvider());
		api.registerRealtimeTranscriptionProvider(buildOpenAIRealtimeTranscriptionProvider());
		api.registerRealtimeVoiceProvider(buildOpenAIRealtimeVoiceProvider());
		api.registerSpeechProvider(buildOpenAISpeechProvider());
		api.registerMediaUnderstandingProvider(openaiMediaUnderstandingProvider);
		api.registerVideoGenerationProvider(buildOpenAIVideoGenerationProvider());
	}
});
//#endregion
export { openai_default as default };
