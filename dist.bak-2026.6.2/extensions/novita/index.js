import { a as buildProviderReplayFamilyHooks } from "../../provider-model-shared-DMISFNXH.js";
import { a as readConfiguredProviderCatalogEntries } from "../../provider-catalog-shared-BDhotFcz.js";
import { t as defineSingleProviderPluginEntry } from "../../provider-entry-CFn_twEc.js";
import { n as buildProviderToolCompatFamilyHooks } from "../../provider-tools-VmwDm8UA.js";
import { n as NOVITA_DEFAULT_MODEL_REF } from "../../models-CYVOjHyx.js";
import { t as buildNovitaProvider } from "../../provider-catalog-Bz1FU-27.js";
//#region extensions/novita/index.ts
const PROVIDER_ID = "novita";
var novita_default = defineSingleProviderPluginEntry({
	id: PROVIDER_ID,
	name: "NovitaAI Provider",
	description: "Bundled NovitaAI provider plugin",
	provider: {
		label: "NovitaAI",
		docsPath: "/providers/novita",
		aliases: ["novita-ai", "novitaai"],
		envVars: ["NOVITA_API_KEY"],
		auth: [{
			methodId: "api-key",
			label: "NovitaAI API key",
			hint: "OpenAI-compatible NovitaAI endpoint",
			optionKey: "novitaApiKey",
			flagName: "--novita-api-key",
			envVar: "NOVITA_API_KEY",
			promptMessage: "Enter NovitaAI API key",
			defaultModel: NOVITA_DEFAULT_MODEL_REF,
			noteTitle: "NovitaAI",
			noteMessage: "Manage API keys at https://novita.ai/settings/key-management"
		}],
		catalog: {
			buildProvider: buildNovitaProvider,
			buildStaticProvider: buildNovitaProvider,
			allowExplicitBaseUrl: true
		},
		augmentModelCatalog: ({ config }) => readConfiguredProviderCatalogEntries({
			config,
			providerId: PROVIDER_ID
		}),
		...buildProviderReplayFamilyHooks({
			family: "openai-compatible",
			dropReasoningFromHistory: false
		}),
		...buildProviderToolCompatFamilyHooks("openai")
	}
});
//#endregion
export { novita_default as default };
