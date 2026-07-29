import "./session-binding-service-CaxPuiXE.js";
import "./thread-bindings-policy-DR_Z9Big.js";
import "./channel-access-compat-BgRApRF_.js";
import "./conversation-binding-D9zd-SLF.js";
import "./binding-registry-gTQK3-zc.js";
import "./session-y3kb__4w.js";
import "./pairing-store-B7VQ4z-N.js";
import "./binding-targets-B8bmEN30.js";
import "./binding-routing-CQ4OOBhG.js";
import "./pairing-labels-D67bL5xP.js";
//#region src/channels/session-meta.ts
let inboundSessionRuntimePromise = null;
function loadInboundSessionRuntime() {
	inboundSessionRuntimePromise ??= import("./inbound.runtime.js");
	return inboundSessionRuntimePromise;
}
/**
* Best-effort inbound session metadata recorder for channel plugin command handlers.
*/
async function recordInboundSessionMetaSafe(params) {
	const runtime = await loadInboundSessionRuntime();
	const storePath = runtime.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	try {
		await runtime.recordSessionMetaFromInbound({
			storePath,
			sessionKey: params.sessionKey,
			ctx: params.ctx
		});
	} catch (err) {
		params.onError?.(err);
	}
}
//#endregion
export { recordInboundSessionMetaSafe as t };
