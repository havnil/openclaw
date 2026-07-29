import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-mnp54Vah.js";
//#region src/shared/google-models.ts
/** Return true when a model id/name refers to the Gemma 4 family. */
function isGemma4ModelId(modelId) {
	const normalized = normalizeLowercaseStringOrEmpty(modelId);
	return /(?:^|[/_:-])gemma[-_]?4(?:$|[/_.:-])/.test(normalized);
}
//#endregion
export { isGemma4ModelId as t };
