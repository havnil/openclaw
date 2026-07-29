import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { t as deepgramMediaUnderstandingProvider } from "../../media-understanding-provider-C91iqqYW.js";
import { t as buildDeepgramRealtimeTranscriptionProvider } from "../../realtime-transcription-provider-BnEs8dGd.js";
//#region extensions/deepgram/index.ts
var deepgram_default = definePluginEntry({
	id: "deepgram",
	name: "Deepgram Media Understanding",
	description: "Bundled Deepgram audio transcription provider",
	register(api) {
		api.registerMediaUnderstandingProvider(deepgramMediaUnderstandingProvider);
		api.registerRealtimeTranscriptionProvider(buildDeepgramRealtimeTranscriptionProvider());
	}
});
//#endregion
export { deepgram_default as default };
