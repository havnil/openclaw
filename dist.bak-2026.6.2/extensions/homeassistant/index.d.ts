import { t as ChannelPlugin } from "../../types.plugin-By-iwHAc.js";
import { n as BundledChannelEntryContract } from "../../channel-entry-contract-BD4dOhJd.js";

//#region extensions/homeassistant/src/channel.d.ts
interface ResolvedHaAccount {
  accountId: string;
  url: string;
  token: string;
  secret: string;
  admins: string[];
}
type HaChannelPlugin = ChannelPlugin<ResolvedHaAccount>;
declare const homeAssistantPlugin: HaChannelPlugin;
//#endregion
//#region extensions/homeassistant/index.d.ts
declare const _default: BundledChannelEntryContract<ChannelPlugin>;
//#endregion
export { _default as default, homeAssistantPlugin };