import { x as findModelInCatalog } from "./model-selection-shared-CRbMpoUU.js";
import { c as resolveDefaultModelForAgent } from "./model-selection-CK2eTa-W.js";
import { i as modelSupportsVision, n as loadModelCatalog } from "./model-catalog-CMMbpb-s.js";
import "./agent-runtime-BWcef-qM.js";
//#region extensions/telegram/src/sticker-vision.runtime.ts
async function resolveStickerVisionSupportRuntime(params) {
	const catalog = await loadModelCatalog({ config: params.cfg });
	const defaultModel = resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	});
	const entry = findModelInCatalog(catalog, defaultModel.provider, defaultModel.model);
	if (!entry) return false;
	return modelSupportsVision(entry);
}
//#endregion
export { resolveStickerVisionSupportRuntime };
