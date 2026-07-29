import { wr as AgentMessage } from "../../index-CuT2F97G.js";
import { In as ProviderSanitizeReplayHistoryContext, Sn as ProviderReplayPolicyContext, bn as ProviderReasoningOutputModeContext, kc as ProviderThinkingProfile, xn as ProviderReplayPolicy, yn as ProviderReasoningOutputMode } from "../../types-BJ3mu3UU.js";
import { Nt as ProviderNormalizeToolSchemasContext, a as AnyAgentTool, en as ProviderToolSchemaDiagnostic, wt as ProviderDefaultThinkingPolicyContext } from "../../plugin-entry-itxMoclV.js";
import { d as createGoogleThinkingStreamWrapper } from "../../provider-stream-shared-BYtGa5zY.js";
//#region extensions/google/provider-hooks.d.ts
declare const GOOGLE_GEMINI_PROVIDER_HOOKS: {
  resolveThinkingProfile: (context: ProviderDefaultThinkingPolicyContext) => ProviderThinkingProfile | undefined;
  wrapStreamFn: typeof createGoogleThinkingStreamWrapper;
  normalizeToolSchemas: (ctx: ProviderNormalizeToolSchemasContext) => AnyAgentTool[];
  inspectToolSchemas: (ctx: ProviderNormalizeToolSchemasContext) => ProviderToolSchemaDiagnostic[];
  buildReplayPolicy?: ((ctx: ProviderReplayPolicyContext) => ProviderReplayPolicy | null | undefined) | undefined;
  sanitizeReplayHistory?: ((ctx: ProviderSanitizeReplayHistoryContext) => Promise<AgentMessage[] | null | undefined> | AgentMessage[] | null | undefined) | undefined;
  resolveReasoningOutputMode?: ((ctx: ProviderReasoningOutputModeContext) => ProviderReasoningOutputMode | null | undefined) | undefined;
};
//#endregion
export { GOOGLE_GEMINI_PROVIDER_HOOKS };