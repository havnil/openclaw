import { i as OpenClawConfig } from "../types.openclaw-20mzwaMw.js";
import { n as PluginMetadataSnapshot } from "../plugin-metadata-snapshot.types-CFYuGTxo.js";
//#region src/agents/models-config.d.ts
/** Ensures models.json and plugin catalog sidecars are current for an agent. */
declare function ensureOpenClawModelsJson(config?: OpenClawConfig, agentDirOverride?: string, options?: {
  pluginMetadataSnapshot?: Pick<PluginMetadataSnapshot, "index" | "manifestRegistry" | "owners">;
  workspaceDir?: string;
  providerDiscoveryProviderIds?: readonly string[];
  providerDiscoveryTimeoutMs?: number;
  providerDiscoveryEntriesOnly?: boolean;
}): Promise<{
  agentDir: string;
  wrote: boolean;
}>;
//#endregion
export { ensureOpenClawModelsJson };