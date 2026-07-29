//#region extensions/codex/doctor-contract-api.ts
function asRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function hasRetiredDynamicToolsProfile(value) {
	return Object.hasOwn(asRecord(value) ?? {}, "codexDynamicToolsProfile");
}
/** Legacy Codex config keys that doctor should report or repair. */
const legacyConfigRules = [{
	path: [
		"plugins",
		"entries",
		"codex",
		"config"
	],
	message: "plugins.entries.codex.config.codexDynamicToolsProfile is retired; Codex app-server always keeps Codex-native workspace tools native. Run \"openclaw doctor --fix\".",
	match: hasRetiredDynamicToolsProfile
}];
/**
* Removes retired Codex plugin config keys while preserving unrelated config.
*/
function normalizeCompatibilityConfig({ cfg }) {
	const rawPluginConfig = asRecord(asRecord(cfg.plugins?.entries?.codex)?.config);
	if (!rawPluginConfig || !hasRetiredDynamicToolsProfile(rawPluginConfig)) return {
		config: cfg,
		changes: []
	};
	const nextConfig = structuredClone(cfg);
	const nextPluginConfig = asRecord(asRecord(asRecord(asRecord(nextConfig.plugins)?.entries)?.codex)?.config);
	if (!nextPluginConfig) return {
		config: cfg,
		changes: []
	};
	delete nextPluginConfig.codexDynamicToolsProfile;
	return {
		config: nextConfig,
		changes: ["Removed retired plugins.entries.codex.config.codexDynamicToolsProfile; Codex app-server always keeps Codex-native workspace tools native."]
	};
}
/** Session/auth ownership metadata used by doctor route-state checks. */
const sessionRouteStateOwners = [{
	id: "codex",
	label: "Codex",
	providerIds: [
		"codex",
		"codex-cli",
		"openai-codex"
	],
	runtimeIds: ["codex", "codex-cli"],
	cliSessionKeys: ["codex-cli"],
	authProfilePrefixes: [
		"codex:",
		"codex-cli:",
		"openai-codex:"
	]
}];
//#endregion
export { legacyConfigRules, normalizeCompatibilityConfig, sessionRouteStateOwners };
