import "./agent-scope-Cs4iFI2N.js";
import { a as resolveAgentDir, o as resolveAgentWorkspaceDir } from "./agent-scope-config-KLbWcRY1.js";
import { n as DEFAULT_MODEL, r as DEFAULT_PROVIDER } from "./defaults-mDjiWzE5.js";
import { a as resolveSessionFilePath, f as resolveStorePath } from "./paths-TD67ZyOm.js";
import { t as loadSessionStore } from "./store-load-DZP7FIL2.js";
import { d as updateSessionStore, f as updateSessionStoreEntry, l as saveSessionStore } from "./store-DlNOQbff.js";
import "./sessions-DZlwceih.js";
import { t as resolveThinkingDefault } from "./model-thinking-default-R5arDD4j.js";
import "./model-selection-CK2eTa-W.js";
import { d as ensureAgentWorkspace } from "./workspace-Cg4Eld0y.js";
import { t as resolveAgentTimeoutMs } from "./timeout-Drw0_zOv.js";
import { n as resolveAgentIdentity } from "./identity-BM7S8bo7.js";
import { t as runEmbeddedAgent } from "./embedded-agent-EtsjtIhv.js";
//#region src/extensionAPI.ts
if (process.env.VITEST !== "true" && process.env.OPENCLAW_SUPPRESS_EXTENSION_API_WARNING !== "1") process.emitWarning("openclaw/extension-api is deprecated. Migrate to api.runtime.agent.* or focused openclaw/plugin-sdk/<subpath> imports. See https://docs.openclaw.ai/plugins/sdk-migration", {
	code: "OPENCLAW_EXTENSION_API_DEPRECATED",
	detail: "This compatibility bridge is temporary. Bundled plugins should use the injected plugin runtime instead of importing host-side agent helpers directly. Migration guide: https://docs.openclaw.ai/plugins/sdk-migration"
});
//#endregion
export { DEFAULT_MODEL, DEFAULT_PROVIDER, ensureAgentWorkspace, loadSessionStore, resolveAgentDir, resolveAgentIdentity, resolveAgentTimeoutMs, resolveAgentWorkspaceDir, resolveSessionFilePath, resolveStorePath, resolveThinkingDefault, runEmbeddedAgent, runEmbeddedAgent as runEmbeddedPiAgent, saveSessionStore, updateSessionStore, updateSessionStoreEntry };
