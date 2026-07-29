import { l as ImageGenerationProvider } from "./types-CNRYqs2u2.js";
import { c as DeepInfraSurfaceModel } from "./provider-models-DwJLcrrJ.js";

//#region extensions/deepinfra/image-generation-provider.d.ts
declare function buildDeepInfraImageGenerationProvider(options?: {
  imageGenModels?: readonly DeepInfraSurfaceModel[];
}): ImageGenerationProvider;
//#endregion
export { buildDeepInfraImageGenerationProvider as t };