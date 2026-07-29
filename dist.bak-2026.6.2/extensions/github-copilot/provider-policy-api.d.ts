import { wt as ProviderDefaultThinkingPolicyContext } from "../../plugin-entry-itxMoclV.js";
//#region extensions/github-copilot/provider-policy-api.d.ts
declare function resolveThinkingProfile(context: ProviderDefaultThinkingPolicyContext): {
  levels: ({
    id: "off";
  } | {
    id: "minimal";
  } | {
    id: "low";
  } | {
    id: "medium";
  } | {
    id: "high";
  } | {
    id: "xhigh";
  })[];
} | null;
//#endregion
export { resolveThinkingProfile };