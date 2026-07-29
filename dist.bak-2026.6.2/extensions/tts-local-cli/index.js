import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { t as buildCliSpeechProvider } from "../../speech-provider-4L04hz25.js";
//#region extensions/tts-local-cli/index.ts
var tts_local_cli_default = definePluginEntry({
	id: "tts-local-cli",
	name: "Local CLI TTS",
	description: "Bundled CLI speech provider for local TTS",
	register(api) {
		api.registerSpeechProvider(buildCliSpeechProvider());
	}
});
//#endregion
export { tts_local_cli_default as default };
