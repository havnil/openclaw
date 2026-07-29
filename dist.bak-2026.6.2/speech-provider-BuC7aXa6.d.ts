import { qn as SpeechProviderPlugin } from "./types-BJ3mu3UU.js";
import { c as DeepInfraSurfaceModel } from "./provider-models-DwJLcrrJ.js";
//#region extensions/deepinfra/speech-provider.d.ts
declare function buildDeepInfraSpeechProvider(options?: {
  ttsModels?: readonly DeepInfraSurfaceModel[];
}): SpeechProviderPlugin;
//#endregion
export { buildDeepInfraSpeechProvider as t };