import { r as normalizeChatChannelId } from "./ids-7k97OzLa.js";
import { t as setPluginEnabledInConfig } from "./toggle-config-BTJXYdbm.js";
//#region src/plugins/enable.ts
/** Enables a plugin in config unless global, denylist, or allowlist policy blocks it. */
function enablePluginInConfig(cfg, pluginId, options = {}) {
	const resolvedId = normalizeChatChannelId(pluginId) ?? pluginId;
	if (cfg.plugins?.enabled === false) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "plugins disabled"
	};
	if (cfg.plugins?.deny?.includes(pluginId) || cfg.plugins?.deny?.includes(resolvedId)) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "blocked by denylist"
	};
	const allow = cfg.plugins?.allow;
	if (Array.isArray(allow) && allow.length > 0 && !allow.includes(pluginId) && !allow.includes(resolvedId)) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "blocked by allowlist"
	};
	return {
		config: setPluginEnabledInConfig(cfg, resolvedId, true, options),
		enabled: true,
		pluginId: resolvedId
	};
}
//#endregion
export { enablePluginInConfig as t };
