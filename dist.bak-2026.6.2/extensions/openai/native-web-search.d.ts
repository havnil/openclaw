import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { Vr as StreamFn } from "../../index-CuT2F97G.js";
//#region extensions/openai/native-web-search.d.ts
type OpenAINativeWebSearchPatchResult = "payload_not_object" | "native_tool_already_present" | "injected";
declare function patchOpenAINativeWebSearchPayload(payload: unknown): OpenAINativeWebSearchPatchResult;
declare function createOpenAINativeWebSearchWrapper(baseStreamFn: StreamFn | undefined, params: {
  config?: OpenClawConfig;
}): StreamFn;
//#endregion
export { createOpenAINativeWebSearchWrapper, patchOpenAINativeWebSearchPayload };