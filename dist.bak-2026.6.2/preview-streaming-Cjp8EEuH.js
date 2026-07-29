import { m as resolveChannelPreviewStreamMode } from "./streaming-8ySbs-Bm.js";
import "./channel-outbound-Cxfd1Zlm.js";
//#region extensions/discord/src/preview-streaming.ts
function resolveDiscordPreviewStreamMode(params = {}) {
	if (params.streaming === void 0 && params.streamMode === void 0) return "progress";
	return resolveChannelPreviewStreamMode(params, "off");
}
//#endregion
export { resolveDiscordPreviewStreamMode as t };
