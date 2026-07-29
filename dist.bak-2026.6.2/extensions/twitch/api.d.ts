import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { $n as PluginRuntime } from "../../types-BJ3mu3UU.js";
import { n as RuntimeEnv } from "../../runtime-Bxifh4bY.js";
import { i as WizardPrompter } from "../../prompts-DgKIGa-v.js";
import { b as OutboundDeliveryResult, i as ChannelOutboundContext, n as ChannelOutboundAdapter } from "../../outbound.types-DMuJZiav.js";
import { T as ChannelMeta, c as ChannelCapabilities, g as ChannelLogSink, r as ChannelAccountSnapshot, v as ChannelMessageActionAdapter, y as ChannelMessageActionContext } from "../../types.core-CZRuyur5.js";
import { L as ChannelResolveKind, R as ChannelResolveResult, U as ChannelStatusAdapter, k as ChannelGatewayContext } from "../../types.adapters-BSvUCykB.js";
import { t as ChannelPlugin } from "../../types.plugin-By-iwHAc.js";
import { t as twitchPlugin } from "../../plugin-C-ML6mB2.js";

//#region extensions/twitch/src/runtime.d.ts
declare const setTwitchRuntime: (next: PluginRuntime) => void, getTwitchRuntime: () => PluginRuntime;
//#endregion
export { type ChannelAccountSnapshot, type ChannelCapabilities, type ChannelGatewayContext, type ChannelLogSink, type ChannelMessageActionAdapter, type ChannelMessageActionContext, type ChannelMeta, type ChannelOutboundAdapter, type ChannelOutboundContext, type ChannelPlugin, type ChannelResolveKind, type ChannelResolveResult, type ChannelStatusAdapter, type OpenClawConfig, type OutboundDeliveryResult, type RuntimeEnv, type WizardPrompter, setTwitchRuntime, twitchPlugin };