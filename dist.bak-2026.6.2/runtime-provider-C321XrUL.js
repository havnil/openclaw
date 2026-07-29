import { t as resolveMemoryBackendConfig } from "./backend-config-CpsOADfG.js";
import "./memory-core-host-runtime-files-BrCXS42r.js";
import { n as closeMemorySearchManager, r as getMemorySearchManager, t as closeAllMemorySearchManagers } from "./memory-Be4ARI6j.js";
//#region extensions/memory-core/src/runtime-provider.ts
const memoryRuntime = {
	async getMemorySearchManager(params) {
		const { manager, error } = await getMemorySearchManager(params);
		return {
			manager,
			error
		};
	},
	resolveMemoryBackendConfig(params) {
		return resolveMemoryBackendConfig(params);
	},
	async closeAllMemorySearchManagers() {
		await closeAllMemorySearchManagers();
	},
	async closeMemorySearchManager(params) {
		await closeMemorySearchManager(params);
	}
};
//#endregion
export { memoryRuntime as t };
