import { i as normalizeApiKeyInput, n as ensureApiKeyFromOptionEnvOrPrompt, s as validateApiKeyInput } from "./provider-auth-input-DWf-_V7c.js";
import { n as buildApiKeyCredential, t as applyAuthProfileConfig } from "./provider-auth-helpers-B1qR-YhE.js";
import { t as applyPrimaryModel } from "./provider-model-primary-CjrsffUO.js";
//#region src/plugins/provider-api-key-auth.runtime.ts
/** Runtime API-key auth helper bundle exposed to provider setup code. */
const providerApiKeyAuthRuntime = {
	applyAuthProfileConfig,
	applyPrimaryModel,
	buildApiKeyCredential,
	ensureApiKeyFromOptionEnvOrPrompt,
	normalizeApiKeyInput,
	validateApiKeyInput
};
//#endregion
export { providerApiKeyAuthRuntime };
