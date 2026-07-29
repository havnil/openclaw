import { Ac as ProviderRuntimeModel } from "../../types-BJ3mu3UU.js";
import { Kt as ProviderResolveDynamicModelContext } from "../../plugin-entry-itxMoclV.js";

//#region extensions/google/provider-models.d.ts
declare function resolveGoogleGeminiForwardCompatModel(params: {
  providerId: string;
  templateProviderId?: string;
  ctx: ProviderResolveDynamicModelContext;
}): ProviderRuntimeModel | undefined;
declare function isModernGoogleModel(modelId: string): boolean;
//#endregion
export { isModernGoogleModel, resolveGoogleGeminiForwardCompatModel };