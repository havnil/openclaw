import { Er as AgentTool } from "./index-CuT2F97G.js";
import { qa as HookContext } from "./types-BJ3mu3UU.js";
import { Dr as ToolDefinition } from "./index-CB0Y7dYg.js";

//#region src/agents/agent-tool-definition-adapter.d.ts
type AnyAgentTool$1 = AgentTool;
/** Convert executable agent tools into session definitions with hook handling. */
declare function toToolDefinitions(tools: AnyAgentTool$1[], hookContext?: HookContext): ToolDefinition[];
//#endregion
//#region src/agents/embedded-agent-runner/tool-split.d.ts
type AnyAgentTool = AgentTool;
declare function splitSdkTools(options: {
  tools: AnyAgentTool[];
  sandboxEnabled: boolean;
  toolHookContext?: HookContext;
}): {
  customTools: ReturnType<typeof toToolDefinitions>;
};
//#endregion
export { splitSdkTools as t };