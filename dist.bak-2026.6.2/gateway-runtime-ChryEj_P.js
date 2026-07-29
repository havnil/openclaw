import "./net-DTe7AQiu.js";
import "./auth-C61W1VgC.js";
import "./client-COa6wJ1q.js";
import "./src-BWAzXRLO.js";
import "./operator-approvals-client-BY5IJU4G.js";
import "./gateway-rpc-BpT0Bgel.js";
import "./hosted-plugin-surface-url-Dco7NxxG.js";
import "./plugin-node-capability-CQtFV9Fn.js";
import "./node-command-policy-BVD7HUTN.js";
import "./nodes.helpers-CEM54L6l.js";
import "./startup-auth-69M83vYj.js";
//#region src/gateway/channel-status-patches.ts
/** Creates a connected-channel status patch with matching connection/event timestamps. */
function createConnectedChannelStatusPatch(at = Date.now()) {
	return {
		connected: true,
		lastConnectedAt: at,
		lastEventAt: at
	};
}
/** Creates a transport-activity patch for health/activity monitors. */
function createTransportActivityStatusPatch(at = Date.now()) {
	return { lastTransportActivityAt: at };
}
//#endregion
export { createTransportActivityStatusPatch as n, createConnectedChannelStatusPatch as t };
