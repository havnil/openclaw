import "./paths-TD67ZyOm.js";
import { t as loadSessionStore$1 } from "./store-load-DZP7FIL2.js";
import "./store-DlNOQbff.js";
import "./targets-Dp0ARsQ6.js";
import "./reset-a_XIeAwW.js";
import "./session-key-CuUtO_nI.js";
import "./transcript-CczmKL_6.js";
import "./send-policy-QgXTqN4G.js";
//#region src/plugin-sdk/session-store-runtime.ts
/**
* @deprecated Use getSessionEntry/listSessionEntries for reads and
* patchSessionEntry/upsertSessionEntry for writes. loadSessionStore keeps the
* legacy mutable whole-store shape and will remain a compatibility escape hatch.
*/
const loadSessionStore = loadSessionStore$1;
//#endregion
export { loadSessionStore as t };
