import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { $n as PluginRuntime } from "../../types-BJ3mu3UU.js";
import { n as normalizeAccountId, t as DEFAULT_ACCOUNT_ID } from "../../account-id-Dh6XMgGH.js";
import { g as chunkText } from "../../outbound.types-DMuJZiav.js";
import { v as ChannelMessageActionAdapter } from "../../types.core-CZRuyur5.js";
import { l as normalizeE164 } from "../../utils-CRegZsWE.js";
import { t as ChannelPlugin } from "../../types.plugin-By-iwHAc.js";
import { r as emptyPluginConfigSchema } from "../../config-schema-BlT2EOxP.js";
import { g as OpenClawPluginApi } from "../../plugin-entry-itxMoclV.js";
import { r as buildChannelConfigSchema } from "../../config-schema-jXAeMqcd.js";
import { s as migrateBaseNameToDefaultAccount, t as applyAccountNameToChannelSection } from "../../setup-helpers-CEEMHs5p.js";
import { n as deleteAccountFromConfigSection, r as setAccountEnabledInConfigSection } from "../../config-helpers-Ch_sthbJ.js";
import { n as formatPairingApproveHint } from "../../helpers-CweSEiet.js";
import { d as getChatChannelMeta } from "../../core-CUaW3XyL.js";
import { t as formatCliCommand } from "../../command-format-CUz7-yqH.js";
import { D as resolveChannelMediaMaxBytes } from "../../media-runtime-CjY6o7UI.js";
import { t as detectBinary } from "../../detect-binary-Drm6r9o4.js";
import { t as formatDocsLink } from "../../links-DFOTZJs1.js";
import { n as resolveAllowlistProviderRuntimeGroupPolicy, r as resolveDefaultGroupPolicy } from "../../runtime-group-policy-DEj6LNUz.js";
import { t as PAIRING_APPROVED_MESSAGE } from "../../pairing-message-CFjlYpMw.js";
import { c as collectStatusIssuesFromLastError, d as createDefaultChannelRuntimeState, n as buildBaseChannelStatusSummary, t as buildBaseAccountStatusSnapshot } from "../../status-helpers-DfSmHgNC.js";
import { o as SignalConfigSchema } from "../../bundled-channel-config-schema-CI6KTArZ.js";
import { a as resolveSignalAccount, c as probeSignal, i as resolveDefaultSignalAccountId, n as listEnabledSignalAccounts, o as SignalAccountConfig, r as listSignalAccountIds, t as ResolvedSignalAccount } from "../../accounts-DhKPNAIQ.js";
import { a as sendMessageSignal, f as monitorSignalProvider, p as signalMessageActions, u as resolveSignalReactionLevel } from "../../send-CcCc0tCv.js";
import { c as installSignalCli, n as normalizeSignalMessagingTarget, t as looksLikeSignalTargetId } from "../../normalize-BtYM5FLJ.js";
import { i as sendReactionSignal, r as removeReactionSignal } from "../../send-reactions-DlHXW-U-.js";

//#region extensions/signal/src/runtime.d.ts
declare const setSignalRuntime: (next: PluginRuntime) => void, getSignalRuntime: () => PluginRuntime, getOptionalSignalRuntime: () => PluginRuntime | null, clearSignalRuntime: () => void;
//#endregion
export { type ChannelMessageActionAdapter, type ChannelPlugin, DEFAULT_ACCOUNT_ID, type OpenClawConfig, type OpenClawPluginApi, PAIRING_APPROVED_MESSAGE, type PluginRuntime, type ResolvedSignalAccount, type SignalAccountConfig, SignalConfigSchema, applyAccountNameToChannelSection, buildBaseAccountStatusSnapshot, buildBaseChannelStatusSummary, buildChannelConfigSchema, chunkText, collectStatusIssuesFromLastError, createDefaultChannelRuntimeState, deleteAccountFromConfigSection, detectBinary, emptyPluginConfigSchema, formatCliCommand, formatDocsLink, formatPairingApproveHint, getChatChannelMeta, installSignalCli, listEnabledSignalAccounts, listSignalAccountIds, looksLikeSignalTargetId, migrateBaseNameToDefaultAccount, monitorSignalProvider, normalizeAccountId, normalizeE164, normalizeSignalMessagingTarget, probeSignal, removeReactionSignal, resolveAllowlistProviderRuntimeGroupPolicy, resolveChannelMediaMaxBytes, resolveDefaultGroupPolicy, resolveDefaultSignalAccountId, resolveSignalAccount, resolveSignalReactionLevel, sendMessageSignal, sendReactionSignal, setAccountEnabledInConfigSection, setSignalRuntime, signalMessageActions };