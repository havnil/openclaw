import { cn as ProviderPlugin } from "../../types-BJ3mu3UU.js";
import { g as OpenClawPluginApi } from "../../plugin-entry-itxMoclV.js";
//#region extensions/minimax/provider-registration.d.ts
declare function buildMinimaxApiProviderPlugin(): ProviderPlugin;
declare function buildMinimaxPortalProviderPlugin(): ProviderPlugin;
declare function registerMinimaxProviders(api: OpenClawPluginApi): void;
//#endregion
export { buildMinimaxApiProviderPlugin, buildMinimaxPortalProviderPlugin, registerMinimaxProviders };