import { n as CodexAppServerRpcError } from "./client-Bhy7cz-H.js";
import { c as getLeasedSharedCodexAppServerClient, m as withTimeout, o as createIsolatedCodexAppServerClient, u as releaseLeasedSharedCodexAppServerClient } from "./shared-client-mWJFBPhg.js";
import { t as resolveCodexAppServerDirectSandboxBypassBlock } from "./sandbox-guard-BmSCU6O3.js";
//#region extensions/codex/src/app-server/capabilities.ts
/**
* Capability helpers for optional Codex app-server control-plane methods.
*/
/** Known app-server methods used by OpenClaw control surfaces. */
const CODEX_CONTROL_METHODS = {
	account: "account/read",
	compact: "thread/compact/start",
	feedback: "feedback/upload",
	listMcpServers: "mcpServerStatus/list",
	listSkills: "skills/list",
	listThreads: "thread/list",
	rateLimits: "account/rateLimits/read",
	resumeThread: "thread/resume",
	review: "review/start"
};
/** Formats unsupported control calls differently from ordinary RPC failures. */
function describeControlFailure(error) {
	if (isUnsupportedControlError(error)) return "unsupported by this Codex app-server";
	return error instanceof Error ? error.message : String(error);
}
function isUnsupportedControlError(error) {
	return error instanceof CodexAppServerRpcError && error.code === -32601;
}
//#endregion
//#region extensions/codex/src/app-server/request.ts
async function requestCodexAppServerJson(params) {
	const sandboxBlock = resolveCodexAppServerDirectSandboxBypassBlock({
		method: params.method,
		requestParams: params.requestParams,
		config: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId
	});
	if (sandboxBlock) throw new Error(sandboxBlock);
	const timeoutMs = params.timeoutMs ?? 6e4;
	return await withTimeout((async () => {
		const client = await (params.isolated ? createIsolatedCodexAppServerClient : getLeasedSharedCodexAppServerClient)({
			startOptions: params.startOptions,
			timeoutMs,
			authProfileId: params.authProfileId,
			agentDir: params.agentDir,
			config: params.config
		});
		try {
			return await client.request(params.method, params.requestParams, { timeoutMs });
		} finally {
			if (params.isolated) await client.closeAndWait({
				exitTimeoutMs: 2e3,
				forceKillDelayMs: 250
			});
			else releaseLeasedSharedCodexAppServerClient(client);
		}
	})(), timeoutMs, `codex app-server ${params.method} timed out`);
}
//#endregion
export { CODEX_CONTROL_METHODS as n, describeControlFailure as r, requestCodexAppServerJson as t };
