import { t as createPluginRuntimeStore } from "./runtime-store-uAKGMqTs.js";
import "./channel-outbound-Cxfd1Zlm.js";
import "./ssrf-runtime-DEr29_Ki.js";
import "./channel-inbound-B-jO6OgQ.js";
import "./channel-pairing-Fiy2EG16.js";
//#region extensions/nextcloud-talk/src/runtime.ts
const { setRuntime: setNextcloudTalkRuntime, getRuntime: getNextcloudTalkRuntime } = createPluginRuntimeStore({
	pluginId: "nextcloud-talk",
	errorMessage: "Nextcloud Talk runtime not initialized"
});
//#endregion
export { setNextcloudTalkRuntime as n, getNextcloudTalkRuntime as t };
