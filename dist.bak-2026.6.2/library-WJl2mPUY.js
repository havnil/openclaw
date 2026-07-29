import { l as normalizeE164 } from "./utils-CCC-BEJH.js";
import { a as loadConfig } from "./io-ET-UkTrJ.js";
import "./config-DpAuWtY_.js";
import { i as handlePortError, n as describePortOwner, r as ensurePortAvailable, t as PortInUseError } from "./ports-PCmBX5W-.js";
import { f as resolveStorePath } from "./paths-TD67ZyOm.js";
import { t as loadSessionStore } from "./store-load-DZP7FIL2.js";
import { l as saveSessionStore } from "./store-DlNOQbff.js";
import { n as resolveSessionKey, t as deriveSessionKey } from "./session-key-CuUtO_nI.js";
import { t as applyTemplate } from "./templating-CLmjS51i.js";
import { t as waitForever } from "./wait-DkbQDWtA.js";
import { t as createDefaultDeps } from "./deps-iQ0R5A1h.js";
//#region src/library.ts
let replyRuntimePromise = null;
let promptRuntimePromise = null;
let binariesRuntimePromise = null;
let execRuntimePromise = null;
let webChannelRuntimePromise = null;
function loadReplyRuntime() {
	replyRuntimePromise ??= import("./reply.runtime.js");
	return replyRuntimePromise;
}
function loadPromptRuntime() {
	promptRuntimePromise ??= import("./prompt-DpYSQe-C.js");
	return promptRuntimePromise;
}
function loadBinariesRuntime() {
	binariesRuntimePromise ??= import("./binaries-_OeHfzoy.js");
	return binariesRuntimePromise;
}
function loadExecRuntime() {
	execRuntimePromise ??= import("./exec-CUwestAg.js");
	return execRuntimePromise;
}
function loadWebChannelRuntime() {
	webChannelRuntimePromise ??= import("./runtime-web-channel-plugin-Bryx_sn6.js");
	return webChannelRuntimePromise;
}
const getReplyFromConfig = async (...args) => (await loadReplyRuntime()).getReplyFromConfig(...args);
const promptYesNo = async (...args) => (await loadPromptRuntime()).promptYesNo(...args);
const ensureBinary = async (...args) => (await loadBinariesRuntime()).ensureBinary(...args);
const runExec = async (...args) => (await loadExecRuntime()).runExec(...args);
const runCommandWithTimeout = async (...args) => (await loadExecRuntime()).runCommandWithTimeout(...args);
const monitorWebChannel = async (...args) => (await loadWebChannelRuntime()).monitorWebChannel(...args);
//#endregion
export { PortInUseError, applyTemplate, createDefaultDeps, deriveSessionKey, describePortOwner, ensureBinary, ensurePortAvailable, getReplyFromConfig, handlePortError, loadConfig, loadSessionStore, monitorWebChannel, normalizeE164, promptYesNo, resolveSessionKey, resolveStorePath, runCommandWithTimeout, runExec, saveSessionStore, waitForever };
