import { d as resolveClaudeThinkingProfile } from "../../provider-model-shared-DMISFNXH.js";
import { n as normalizeAnthropicProviderConfigForProvider, t as applyAnthropicConfigDefaults } from "../../config-defaults-DuXs-l2o.js";
//#region extensions/anthropic/provider-policy-api.ts
/**
* Provider-policy API for Anthropic and Claude CLI. Core calls this lightweight
* path for config defaults and thinking profiles.
*/
/** Normalize Anthropic provider config without importing runtime registration. */
function normalizeConfig(params) {
	return normalizeAnthropicProviderConfigForProvider(params);
}
/** Apply Anthropic config defaults through the provider-policy seam. */
function applyConfigDefaults(params) {
	return applyAnthropicConfigDefaults(params);
}
/** Resolve Claude thinking profile for Anthropic or Claude CLI providers. */
function resolveThinkingProfile(params) {
	switch (params.provider.trim().toLowerCase()) {
		case "anthropic":
		case "claude-cli": return resolveClaudeThinkingProfile(params.modelId);
		default: return null;
	}
}
//#endregion
export { applyConfigDefaults, normalizeConfig, resolveThinkingProfile };
