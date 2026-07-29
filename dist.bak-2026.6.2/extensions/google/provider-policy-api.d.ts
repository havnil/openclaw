import { f as ModelProviderConfig } from "../../types.models-BLnM5Oim.js";
import { kc as ProviderThinkingProfile } from "../../types-BJ3mu3UU.js";
import { wt as ProviderDefaultThinkingPolicyContext } from "../../plugin-entry-itxMoclV.js";
//#region extensions/google/provider-policy-api.d.ts
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
declare function resolveThinkingProfile(context: ProviderDefaultThinkingPolicyContext): ProviderThinkingProfile | undefined;
//#endregion
export { normalizeConfig, resolveThinkingProfile };