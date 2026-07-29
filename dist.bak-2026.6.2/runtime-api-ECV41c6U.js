import "./media-runtime-CSixP__U.js";
import "./text-chunking-D45TeeEs.js";
import { t as createPluginRuntimeStore } from "./runtime-store-uAKGMqTs.js";
import "./channel-outbound-Cxfd1Zlm.js";
import "./outbound-media-Cwmv8C1g.js";
import "./ssrf-runtime-DEr29_Ki.js";
import "./dangerous-name-runtime-zP2lSdMQ.js";
import "./channel-status-DxlXr0Xh.js";
import "./bundled-channel-config-schema-DdNaBuhs.js";
import "./channel-config-primitives-BkdsAkqG.js";
import "./channel-actions-TpPb-Ab3.js";
import "./channel-inbound-B-jO6OgQ.js";
import "./channel-feedback-Db70cXx6.js";
import "./channel-pairing-Fiy2EG16.js";
import "./webhook-request-guards-u3CUO-Za.js";
import "./webhook-ingress-dOxUkHlN.js";
import "./webhook-targets-Df8ZNJ0j.js";
//#region extensions/googlechat/src/runtime.ts
const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } = createPluginRuntimeStore({
	pluginId: "googlechat",
	errorMessage: "Google Chat runtime not initialized"
});
//#endregion
export { setGoogleChatRuntime as n, getGoogleChatRuntime as t };
