import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { h as ProviderRequestCapability } from "../../provider-request-config-BYDtLJQe.js";
import { s as AuthProfileStore } from "../../types-BLLmx7NZ.js";
import { h as resolveProviderHttpRequestConfig } from "../../provider-http-CPhgXbYc.js";
//#region extensions/fal/http-config.d.ts
type FalAuthenticatedRequest = {
  cfg?: OpenClawConfig;
  agentDir?: string;
  authStore?: AuthProfileStore;
};
declare function resolveFalHttpRequestConfig(params: {
  req: FalAuthenticatedRequest;
  baseUrl?: string;
  capability: ProviderRequestCapability;
}): Promise<ReturnType<typeof resolveProviderHttpRequestConfig>>;
//#endregion
export { resolveFalHttpRequestConfig };