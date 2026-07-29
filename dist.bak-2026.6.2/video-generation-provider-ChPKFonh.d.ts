import { o as VideoGenerationProvider } from "./video-generation-88kJh7JY.js";
import { c as DeepInfraSurfaceModel } from "./provider-models-DwJLcrrJ.js";

//#region extensions/deepinfra/video-generation-provider.d.ts
declare function buildDeepInfraVideoGenerationProvider(options?: {
  videoGenModels?: readonly DeepInfraSurfaceModel[];
}): VideoGenerationProvider;
//#endregion
export { buildDeepInfraVideoGenerationProvider as t };