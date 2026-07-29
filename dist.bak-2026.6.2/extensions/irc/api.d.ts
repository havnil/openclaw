import { n as ChannelSetupWizard } from "../../setup-wizard-types-Bvf5l7kl.js";
import { H as ChannelSetupAdapter } from "../../types.adapters-BSvUCykB.js";
import { a as resolveDefaultIrcAccountId, i as listIrcAccountIds, n as ResolvedIrcAccount, o as resolveIrcAccount, r as listEnabledIrcAccounts, t as ircPlugin } from "../../channel-DZ7LJvSf.js";
import { t as setIrcRuntime } from "../../runtime-CueBvSpv.js";
//#region extensions/irc/src/setup-core.d.ts
declare const ircSetupAdapter: ChannelSetupAdapter;
//#endregion
//#region extensions/irc/src/setup-surface.d.ts
declare const ircSetupWizard: ChannelSetupWizard;
//#endregion
export { type ResolvedIrcAccount, ircPlugin, ircSetupAdapter, ircSetupWizard, listEnabledIrcAccounts, listIrcAccountIds, resolveDefaultIrcAccountId, resolveIrcAccount, setIrcRuntime };