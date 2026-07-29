import { $t as ProviderThinkingProfile } from "../../plugin-entry-itxMoclV.js";

//#region extensions/openai/thinking-policy.d.ts
declare function resolveOpenAIThinkingProfile(modelId: string): ProviderThinkingProfile;
declare function resolveOpenAICodexThinkingProfile(modelId: string): ProviderThinkingProfile;
declare function resolveUnifiedOpenAIThinkingProfile(modelId: string): ProviderThinkingProfile;
//#endregion
export { resolveOpenAICodexThinkingProfile, resolveOpenAIThinkingProfile, resolveUnifiedOpenAIThinkingProfile };