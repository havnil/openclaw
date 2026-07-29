import { m as ModelProviderDeclarationConfig } from "../../types.models-BLnM5Oim.js";
import { cn as ProviderPlugin } from "../../types-BJ3mu3UU.js";
import { r as CodexAppServerStartOptions } from "../../auth-bridge-BxQLAbrR.js";
import { r as CodexAppServerModelListResult } from "../../models-BCrKYLUR.js";

//#region extensions/codex/provider.d.ts
type CodexModelLister = (options: {
  timeoutMs: number;
  limit?: number;
  cursor?: string;
  startOptions?: CodexAppServerStartOptions;
  sharedClient?: boolean;
}) => Promise<CodexAppServerModelListResult>;
type BuildCodexProviderOptions = {
  pluginConfig?: unknown;
  listModels?: CodexModelLister;
};
type BuildCatalogOptions = {
  env?: NodeJS.ProcessEnv;
  pluginConfig?: unknown;
  listModels?: CodexModelLister;
  onDiscoveryFailure?: (error: unknown) => void;
};
/**
 * Builds the Codex provider plugin, including setup metadata, catalog discovery,
 * dynamic model resolution, and prompt/thinking hooks.
 */
declare function buildCodexProvider(options?: BuildCodexProviderOptions): ProviderPlugin;
/**
 * Builds the Codex model catalog from live app-server discovery, falling back
 * to built-in model records when discovery is disabled or unavailable.
 */
declare function buildCodexProviderCatalog(options?: BuildCatalogOptions): Promise<{
  provider: ModelProviderDeclarationConfig;
}>;
/**
 * Returns true for Codex models that use the modern reasoning effort enum and
 * reject the legacy CLI `minimal` default.
 */
declare function isModernCodexModel(modelId: string): boolean;
//#endregion
export { buildCodexProvider, buildCodexProviderCatalog, isModernCodexModel };