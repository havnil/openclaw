import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";

//#region src/plugins/enable.d.ts
/** Result of enabling a plugin in config. */
type PluginEnableResult = {
  config: OpenClawConfig;
  enabled: boolean;
  pluginId: string;
  reason?: string;
};
/** Enables a plugin in config unless global, denylist, or allowlist policy blocks it. */
declare function enablePluginInConfig(cfg: OpenClawConfig, pluginId: string, options?: {
  updateChannelConfig?: boolean;
}): PluginEnableResult;
//#endregion
export { enablePluginInConfig as t };