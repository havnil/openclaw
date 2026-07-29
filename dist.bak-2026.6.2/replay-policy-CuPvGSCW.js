import { n as NATIVE_ANTHROPIC_REPLAY_HOOKS } from "./provider-model-shared-DMISFNXH.js";
//#region extensions/anthropic/replay-policy.ts
/**
* Anthropic replay-policy bridge. It re-exports the native Anthropic replay
* policy from the shared provider-model hooks and fails fast if it disappears.
*/
const { buildReplayPolicy } = NATIVE_ANTHROPIC_REPLAY_HOOKS;
if (!buildReplayPolicy) throw new Error("Expected native Anthropic replay hooks to expose buildReplayPolicy.");
//#endregion
export { buildReplayPolicy as t };
