import { E as resolveConfiguredModelNameHint, S as isFoundryProviderApi, b as extractFoundryEndpoint, h as TOKEN_REFRESH_MARGIN_MS, o as CachedTokenEntry, y as buildFoundryProviderBaseUrl } from "../../shared-DrXZ9N6e.js";

//#region extensions/microsoft-foundry/shared-runtime.d.ts
declare function getFoundryTokenCacheKey(params?: {
  subscriptionId?: string;
  tenantId?: string;
}): string;
//#endregion
export { type CachedTokenEntry, TOKEN_REFRESH_MARGIN_MS, buildFoundryProviderBaseUrl, extractFoundryEndpoint, getFoundryTokenCacheKey, isFoundryProviderApi, resolveConfiguredModelNameHint };