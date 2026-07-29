import "./utils-CCC-BEJH.js";
import "./types.secrets-_0JOMGE5.js";
import "./setup-helpers-DO5nSeNy.js";
import "./setup-binary-BZXJR3B_.js";
import "./setup-wizard-helpers-CoplU_Ox.js";
import "./setup-wizard-proxy-CvlL6M1R.js";
//#region src/plugin-sdk/resolution-notes.ts
/** Format a short note that separates successfully resolved targets from unresolved passthrough values. */
function formatResolvedUnresolvedNote(params) {
	if (params.resolved.length === 0 && params.unresolved.length === 0) return;
	return [params.resolved.length > 0 ? `Resolved: ${params.resolved.join(", ")}` : void 0, params.unresolved.length > 0 ? `Unresolved (kept as typed): ${params.unresolved.join(", ")}` : void 0].filter(Boolean).join("\n");
}
//#endregion
export { formatResolvedUnresolvedNote as t };
