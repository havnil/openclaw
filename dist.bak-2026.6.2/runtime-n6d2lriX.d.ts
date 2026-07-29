import { $n as PluginRuntime } from "./types-BJ3mu3UU.js";
import { f as sendMessageDiscord } from "./send-B3F_JNQo.js";
import { t as discordMessageActions } from "./channel-actions-BcbMgMdN.js";

//#region extensions/discord/src/runtime.d.ts
type DiscordChannelRuntime = {
  messageActions?: typeof discordMessageActions;
  sendMessageDiscord?: typeof sendMessageDiscord;
};
type DiscordRuntime = PluginRuntime & {
  channel: PluginRuntime["channel"] & {
    discord?: DiscordChannelRuntime;
  };
};
declare const setDiscordRuntime: (next: DiscordRuntime) => void, getOptionalDiscordRuntime: () => DiscordRuntime | null, getDiscordRuntime: () => DiscordRuntime;
//#endregion
export { setDiscordRuntime as t };