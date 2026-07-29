import { j as streamWithPayloadPatch } from "../../provider-stream-shared-BYtGa5zY.js";
//#region extensions/deepinfra/cache-wrapper.d.ts
type StreamFn = Parameters<typeof streamWithPayloadPatch>[0];
declare function createDeepInfraAnthropicCacheWrapper(baseStreamFn: StreamFn): StreamFn;
//#endregion
export { createDeepInfraAnthropicCacheWrapper };