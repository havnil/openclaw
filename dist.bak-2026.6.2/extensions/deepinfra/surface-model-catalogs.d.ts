import { f as UnifiedModelCatalogEntry } from "../../manifest-registry-QVxxPOAD.js";
import { ln as UnifiedModelCatalogProviderContext } from "../../plugin-entry-itxMoclV.js";
import { a as VideoGenerationModelCapabilitiesContext, s as VideoGenerationProviderCapabilities } from "../../video-generation-88kJh7JY.js";

//#region extensions/deepinfra/surface-model-catalogs.d.ts
declare function listDeepInfraImageGenCatalog(ctx: UnifiedModelCatalogProviderContext): Promise<readonly UnifiedModelCatalogEntry[] | null>;
declare function listDeepInfraVideoGenCatalog(ctx: UnifiedModelCatalogProviderContext): Promise<readonly UnifiedModelCatalogEntry<VideoGenerationProviderCapabilities>[] | null>;
declare function resolveDeepInfraVideoModelCapabilities(ctx: VideoGenerationModelCapabilitiesContext): Promise<VideoGenerationProviderCapabilities | undefined>;
//#endregion
export { listDeepInfraImageGenCatalog, listDeepInfraVideoGenCatalog, resolveDeepInfraVideoModelCapabilities };