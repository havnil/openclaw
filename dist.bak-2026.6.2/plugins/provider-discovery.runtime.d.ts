import { i as OpenClawConfig } from "../types.openclaw-20mzwaMw.js";
import { t as PluginMetadataRegistryView } from "../plugin-metadata-snapshot.types-CFYuGTxo.js";
import { cn as ProviderPlugin } from "../types-BJ3mu3UU.js";

//#region src/plugins/provider-discovery.runtime.d.ts
declare function clearProviderDiscoveryModuleLoaders(): void;
declare function resolvePluginDiscoveryProvidersRuntime(params: {
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  bundledProviderVitestCompat?: boolean;
  onlyPluginIds?: string[];
  includeUntrustedWorkspacePlugins?: boolean;
  requireCompleteDiscoveryEntryCoverage?: boolean;
  discoveryEntriesOnly?: boolean;
  pluginMetadataSnapshot?: PluginMetadataRegistryView;
}): ProviderPlugin[];
//#endregion
export { clearProviderDiscoveryModuleLoaders, resolvePluginDiscoveryProvidersRuntime };