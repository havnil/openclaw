import "./shared-B74k4y2W.js";
//#region extensions/microsoft-foundry/shared-runtime.ts
function getFoundryTokenCacheKey(params) {
	return `${params?.subscriptionId ?? ""}:${params?.tenantId ?? ""}`;
}
//#endregion
export { getFoundryTokenCacheKey as t };
