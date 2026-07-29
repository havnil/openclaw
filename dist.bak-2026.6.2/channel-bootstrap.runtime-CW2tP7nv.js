import "./agent-scope-Cs4iFI2N.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-KLbWcRY1.js";
import { t as applyPluginAutoEnable } from "./plugin-auto-enable-3e9q02Ui.js";
import { d as resolveRuntimePluginRegistry } from "./loader-B83dNzFF.js";
import { c as getActivePluginRegistryVersion, n as getActivePluginChannelRegistryVersion, o as getActivePluginRegistry, t as getActivePluginChannelRegistry } from "./runtime-GvuRxkp5.js";
//#region src/infra/outbound/channel-bootstrap.runtime.ts
const bootstrapAttempts = /* @__PURE__ */ new Set();
/** Clears the per-registry channel bootstrap retry guard for isolated tests. */
function resetOutboundChannelBootstrapStateForTests() {
	bootstrapAttempts.clear();
}
function channelEntryCanSend(entry) {
	return Boolean(entry?.plugin?.outbound?.sendText ?? entry?.plugin?.message?.send?.text);
}
function findChannelEntry(registry, channel) {
	return registry?.channels?.find((entry) => entry?.plugin?.id === channel);
}
function canResolveSendCapableChannel(channel) {
	const activeChannelRegistry = getActivePluginChannelRegistry();
	if (channelEntryCanSend(findChannelEntry(activeChannelRegistry, channel))) return true;
	const activeRegistry = getActivePluginRegistry();
	if (activeRegistry && activeRegistry !== activeChannelRegistry) return channelEntryCanSend(findChannelEntry(activeRegistry, channel));
	return false;
}
/** Loads runtime plugins on demand when a selected outbound channel has only a setup shell. */
function bootstrapOutboundChannelPlugin(params) {
	const cfg = params.cfg;
	if (!cfg) return;
	if (canResolveSendCapableChannel(params.channel)) return;
	const attemptKey = `${getActivePluginChannelRegistryVersion()}:${getActivePluginRegistryVersion()}:${params.channel}`;
	if (bootstrapAttempts.has(attemptKey)) return;
	bootstrapAttempts.add(attemptKey);
	const autoEnabled = applyPluginAutoEnable({ config: cfg });
	const defaultAgentId = resolveDefaultAgentId(autoEnabled.config);
	const workspaceDir = resolveAgentWorkspaceDir(autoEnabled.config, defaultAgentId);
	try {
		resolveRuntimePluginRegistry({
			config: autoEnabled.config,
			activationSourceConfig: cfg,
			autoEnabledReasons: autoEnabled.autoEnabledReasons,
			workspaceDir,
			runtimeOptions: { allowGatewaySubagentBinding: true }
		});
		if (!canResolveSendCapableChannel(params.channel)) bootstrapAttempts.delete(attemptKey);
	} catch {
		bootstrapAttempts.delete(attemptKey);
	}
}
//#endregion
export { resetOutboundChannelBootstrapStateForTests as n, bootstrapOutboundChannelPlugin as t };
