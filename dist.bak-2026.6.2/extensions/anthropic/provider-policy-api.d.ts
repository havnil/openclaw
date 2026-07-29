import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { f as ModelProviderConfig } from "../../types.models-BLnM5Oim.js";
import { kc as ProviderThinkingProfile } from "../../types-BJ3mu3UU.js";
import { t as applyAnthropicConfigDefaults } from "../../config-defaults-CXBrKt-4.js";
//#region extensions/anthropic/provider-policy-api.d.ts
/** Normalize Anthropic provider config without importing runtime registration. */
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
/** Apply Anthropic config defaults through the provider-policy seam. */
declare function applyConfigDefaults(params: Parameters<typeof applyAnthropicConfigDefaults>[0]): OpenClawConfig;
/** Resolve Claude thinking profile for Anthropic or Claude CLI providers. */
declare function resolveThinkingProfile(params: {
  provider: string;
  modelId: string;
}): ProviderThinkingProfile | null;
//#endregion
export { applyConfigDefaults, normalizeConfig, resolveThinkingProfile };