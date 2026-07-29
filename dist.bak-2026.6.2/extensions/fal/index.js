import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { t as buildFalImageGenerationProvider } from "../../image-generation-provider-CyASZxuG.js";
import { t as buildFalMusicGenerationProvider } from "../../music-generation-provider-CRAw9iGF.js";
import { t as createFalProvider } from "../../provider-registration-nD9oI93f.js";
import { t as buildFalVideoGenerationProvider } from "../../video-generation-provider-BQP95cM9.js";
var fal_default = definePluginEntry({
	id: "fal",
	name: "fal Provider",
	description: "Bundled fal image, video, and music generation provider",
	register(api) {
		api.registerProvider(createFalProvider());
		api.registerImageGenerationProvider(buildFalImageGenerationProvider());
		api.registerMusicGenerationProvider(buildFalMusicGenerationProvider());
		api.registerVideoGenerationProvider(buildFalVideoGenerationProvider());
	}
});
//#endregion
export { fal_default as default };
