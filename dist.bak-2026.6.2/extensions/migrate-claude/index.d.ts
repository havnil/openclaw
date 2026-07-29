import { A as OpenClawPluginDefinition } from "../../types-BJ3mu3UU.js";
import { v as OpenClawPluginConfigSchema, y as OpenClawPluginDefinition$1 } from "../../plugin-entry-itxMoclV.js";
//#region extensions/migrate-claude/index.d.ts
declare const _default: {
  id: string;
  name: string;
  description: string;
  configSchema: OpenClawPluginConfigSchema;
  register: NonNullable<OpenClawPluginDefinition$1["register"]>;
} & Pick<OpenClawPluginDefinition, "kind" | "reload" | "nodeHostCommands" | "securityAuditCollectors">;
//#endregion
export { _default as default };