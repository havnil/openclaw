import { v as resolveSessionAgentId } from "./agent-scope-Cs4iFI2N.js";
import { f as resolveStorePath } from "./paths-TD67ZyOm.js";
import { H as resolveSessionStoreEntry, t as loadSessionStore } from "./store-load-DZP7FIL2.js";
import "./sessions-DZlwceih.js";
import { n as resolveAcpSessionCwd } from "./session-identifiers-Yz4V9hoo.js";
import { c as persistAcpTurnTranscript } from "./attempt-execution-Tks2bM4e.js";
//#region src/auto-reply/reply/dispatch-acp-transcript.runtime.ts
async function persistAcpDispatchTranscript(params) {
	const promptText = params.promptText.trim();
	const finalText = params.finalText.trim();
	if (!promptText && !finalText) return;
	const sessionAgentId = resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId: sessionAgentId });
	const sessionStore = loadSessionStore(storePath, { skipCache: true });
	const sessionEntry = resolveSessionStoreEntry({
		store: sessionStore,
		sessionKey: params.sessionKey
	}).existing;
	const sessionId = sessionEntry?.sessionId;
	if (!sessionId) throw new Error(`unknown ACP session key: ${params.sessionKey}`);
	await persistAcpTurnTranscript({
		body: promptText,
		transcriptBody: promptText,
		finalText,
		sessionId,
		sessionKey: params.sessionKey,
		sessionEntry,
		sessionStore,
		storePath,
		sessionAgentId,
		threadId: params.threadId,
		sessionCwd: resolveAcpSessionCwd(params.meta) ?? process.cwd(),
		config: params.cfg
	});
}
//#endregion
export { persistAcpDispatchTranscript };
