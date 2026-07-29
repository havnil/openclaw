import { n as buildBraveWebSearchProviderBase } from "../../web-search-shared-BP0MpYKA.js";
//#region extensions/brave/web-search-contract-api.ts
/** Create the Brave provider descriptor for contract checks. */
function createBraveWebSearchProvider() {
	return {
		...buildBraveWebSearchProviderBase(),
		createTool: () => null
	};
}
//#endregion
export { createBraveWebSearchProvider };
