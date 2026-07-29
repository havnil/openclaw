import { p as resolveUserPath } from "./utils-CCC-BEJH.js";
import { s as normalizePluginsConfig } from "./config-state-KZ7aqPVt.js";
import { r as getCurrentPluginMetadataSnapshot } from "./current-plugin-metadata-snapshot-D0CZyLLu.js";
import { u as getActivePluginRuntimeSubagentMode } from "./runtime-GvuRxkp5.js";
import { t as ensureStandaloneRuntimePluginRegistryLoaded } from "./standalone-runtime-registry-loader-c_T-htHI.js";
//#region src/agents/runtime-plugins.ts
function resolveStartupPluginIdsFromCurrentSnapshot(params) {
	const pluginIds = getCurrentPluginMetadataSnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir
	})?.startup?.pluginIds;
	if (!Array.isArray(pluginIds)) return;
	return pluginIds.filter((pluginId) => typeof pluginId === "string");
}
/** Ensure standalone runtime plugins are loaded for the current agent context. */
function ensureRuntimePluginsLoaded(params) {
	if (params.config && !normalizePluginsConfig(params.config.plugins).enabled) return;
	const workspaceDir = typeof params.workspaceDir === "string" && params.workspaceDir.trim() ? resolveUserPath(params.workspaceDir) : void 0;
	const startupPluginIds = resolveStartupPluginIdsFromCurrentSnapshot({
		config: params.config,
		workspaceDir
	});
	const allowGatewaySubagentBinding = params.allowGatewaySubagentBinding === true || getActivePluginRuntimeSubagentMode() === "gateway-bindable";
	ensureStandaloneRuntimePluginRegistryLoaded({
		requiredPluginIds: startupPluginIds,
		loadOptions: {
			config: params.config,
			workspaceDir,
			...startupPluginIds === void 0 ? {} : { onlyPluginIds: startupPluginIds },
			runtimeOptions: allowGatewaySubagentBinding ? { allowGatewaySubagentBinding: true } : void 0
		}
	});
}
//#endregion
export { ensureRuntimePluginsLoaded as t };
