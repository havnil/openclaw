import { Vr as StreamFn } from "./index-CuT2F97G.js";
import { an as ProviderWrapStreamFnContext } from "./plugin-entry-itxMoclV.js";
//#region extensions/qwen/stream.d.ts
type QwenThinkingLevel = ProviderWrapStreamFnContext["thinkingLevel"];
type QwenThinkingFormat = string | undefined;
declare function createQwenThinkingWrapper(baseStreamFn: StreamFn | undefined, thinkingLevel: QwenThinkingLevel, thinkingFormat?: QwenThinkingFormat): StreamFn;
declare function wrapQwenProviderStream(ctx: ProviderWrapStreamFnContext): StreamFn | undefined;
//#endregion
export { wrapQwenProviderStream as n, createQwenThinkingWrapper as t };