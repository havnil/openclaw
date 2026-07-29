import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { n as buildMinimaxPortalImageGenerationProvider, t as buildMinimaxImageGenerationProvider } from "../../image-generation-provider-BIHOcm8m.js";
import { n as minimaxPortalMediaUnderstandingProvider, t as minimaxMediaUnderstandingProvider } from "../../media-understanding-provider-C93hTKVB.js";
import { n as buildMinimaxPortalMusicGenerationProvider, t as buildMinimaxMusicGenerationProvider } from "../../music-generation-provider-CdqtCy1-.js";
import { r as registerMinimaxProviders } from "../../provider-registration-CxhmVxKp.js";
import { t as buildMinimaxSpeechProvider } from "../../speech-provider-D45z2qiN.js";
import { t as createMiniMaxWebSearchProvider } from "../../minimax-web-search-provider-FHjz5MpO.js";
import { n as buildMinimaxVideoGenerationProvider, t as buildMinimaxPortalVideoGenerationProvider } from "../../video-generation-provider-Da4wxtD6.js";
//#region extensions/minimax/index.ts
var minimax_default = definePluginEntry({
	id: "minimax",
	name: "MiniMax",
	description: "Bundled MiniMax API-key and OAuth provider plugin",
	register(api) {
		registerMinimaxProviders(api);
		api.registerMediaUnderstandingProvider(minimaxMediaUnderstandingProvider);
		api.registerMediaUnderstandingProvider(minimaxPortalMediaUnderstandingProvider);
		api.registerImageGenerationProvider(buildMinimaxImageGenerationProvider());
		api.registerImageGenerationProvider(buildMinimaxPortalImageGenerationProvider());
		api.registerMusicGenerationProvider(buildMinimaxMusicGenerationProvider());
		api.registerMusicGenerationProvider(buildMinimaxPortalMusicGenerationProvider());
		api.registerVideoGenerationProvider(buildMinimaxVideoGenerationProvider());
		api.registerVideoGenerationProvider(buildMinimaxPortalVideoGenerationProvider());
		api.registerSpeechProvider(buildMinimaxSpeechProvider());
		api.registerWebSearchProvider(createMiniMaxWebSearchProvider());
	}
});
//#endregion
export { minimax_default as default };
