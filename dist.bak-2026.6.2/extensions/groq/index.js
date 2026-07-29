import { t as definePluginEntry } from "../../plugin-entry-DysgT_5W.js";
import { t as groqMediaUnderstandingProvider } from "../../media-understanding-provider-B2vWhbbz.js";
//#region extensions/groq/index.ts
var groq_default = definePluginEntry({
	id: "groq",
	name: "Groq Provider",
	description: "Bundled Groq provider plugin",
	register(api) {
		api.registerProvider({
			id: "groq",
			label: "Groq",
			docsPath: "/providers/groq",
			envVars: ["GROQ_API_KEY"],
			auth: []
		});
		api.registerMediaUnderstandingProvider(groqMediaUnderstandingProvider);
	}
});
//#endregion
export { groq_default as default };
