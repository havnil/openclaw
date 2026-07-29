//#region src/config/patch-replace-paths.ts
function normalizeConfigPatchReplacePath(value) {
	const normalized = value.trim().replace(/\[(?:\d*)\]/g, "[]");
	return normalized.endsWith("[]") ? normalized.slice(0, -2) : normalized;
}
function normalizeConfigPatchReplacePaths(values) {
	if (!values) return /* @__PURE__ */ new Set();
	return new Set(values.filter((value) => typeof value === "string").map(normalizeConfigPatchReplacePath).filter((value) => value.length > 0));
}
//#endregion
export { normalizeConfigPatchReplacePaths as t };
