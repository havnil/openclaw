import { Vr as StreamFn } from "../../index-CuT2F97G.js";
import { an as ProviderWrapStreamFnContext } from "../../plugin-entry-itxMoclV.js";
//#region extensions/xai/stream.d.ts
declare function createXaiToolPayloadCompatibilityWrapper(baseStreamFn: StreamFn | undefined): StreamFn;
declare function createXaiFastModeWrapper(baseStreamFn: StreamFn | undefined, fastMode: boolean): StreamFn;
declare function wrapXaiProviderStream(ctx: ProviderWrapStreamFnContext): StreamFn | undefined;
//#endregion
export { createXaiFastModeWrapper, createXaiToolPayloadCompatibilityWrapper, wrapXaiProviderStream };