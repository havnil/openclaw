import { f as ModelProviderConfig } from "../../types.models-BLnM5Oim.js";
import { kc as ProviderThinkingProfile } from "../../types-BJ3mu3UU.js";
//#region extensions/openai/provider-policy-api.d.ts
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
declare function resolveThinkingProfile(params: {
  provider: string;
  modelId: string;
}): ProviderThinkingProfile | null;
//#endregion
export { normalizeConfig, resolveThinkingProfile };