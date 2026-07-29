import { i as PASSTHROUGH_GEMINI_REPLAY_HOOKS } from "../../provider-model-shared-DMISFNXH.js";
import { a as readConfiguredProviderCatalogEntries } from "../../provider-catalog-shared-BDhotFcz.js";
import { t as defineSingleProviderPluginEntry } from "../../provider-entry-CFn_twEc.js";
import { s as KILOCODE_DEFAULT_MODEL_REF } from "../../provider-models-sezqvstb.js";
import { n as buildKilocodeProviderWithDiscovery, t as buildKilocodeProvider } from "../../provider-catalog-CsfqzTGO.js";
import { t as applyKilocodeConfig } from "../../onboard-BXHq3Tvu.js";
import { n as wrapKilocodeProviderStream } from "../../stream-BXMfh3hz.js";
//#region extensions/kilocode/index.ts
const PROVIDER_ID = "kilocode";
var kilocode_default = defineSingleProviderPluginEntry({
	id: PROVIDER_ID,
	name: "Kilo Gateway Provider",
	description: "Bundled Kilo Gateway provider plugin",
	provider: {
		label: "Kilo Gateway",
		docsPath: "/providers/kilocode",
		auth: [{
			methodId: "api-key",
			label: "Kilo Gateway API key",
			hint: "API key (OpenRouter-compatible)",
			optionKey: "kilocodeApiKey",
			flagName: "--kilocode-api-key",
			envVar: "KILOCODE_API_KEY",
			promptMessage: "Enter Kilo Gateway API key",
			defaultModel: KILOCODE_DEFAULT_MODEL_REF,
			applyConfig: (cfg) => applyKilocodeConfig(cfg)
		}],
		catalog: {
			buildProvider: buildKilocodeProviderWithDiscovery,
			buildStaticProvider: buildKilocodeProvider
		},
		augmentModelCatalog: ({ config }) => readConfiguredProviderCatalogEntries({
			config,
			providerId: PROVIDER_ID
		}),
		...PASSTHROUGH_GEMINI_REPLAY_HOOKS,
		wrapStreamFn: wrapKilocodeProviderStream,
		isCacheTtlEligible: (ctx) => ctx.modelId.startsWith("anthropic/")
	}
});
//#endregion
export { kilocode_default as default };
