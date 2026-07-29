import { a as resolveServicePrefixedAllowTarget, c as resolveServicePrefixedTarget, i as parseChatTargetPrefixesOrThrow, o as resolveServicePrefixedChatTarget, r as parseChatAllowTargetPrefixes, s as resolveServicePrefixedOrChatAllowTarget, t as createAllowedChatSenderMatcher } from "../../chat-target-prefixes-YaCG6IZV.js";
import { a as resolveIMessageAccount, i as resolveDefaultIMessageAccountId, n as listEnabledIMessageAccounts, r as listIMessageAccountIds } from "../../accounts-CW9PeJ5t.js";
import { n as IMESSAGE_ACTIONS, r as IMESSAGE_ACTION_NAMES } from "../../message-tool-api-DmWClM_m.js";
import { n as DEFAULT_IMESSAGE_PROBE_TIMEOUT_MS } from "../../client-C659xeFD.js";
import { a as looksLikeIMessageExplicitTargetId, c as parseIMessageTarget, i as isAllowedIMessageSender, n as inferIMessageTargetChatType, o as normalizeIMessageHandle, s as parseIMessageAllowTarget, t as formatIMessageChatTarget } from "../../targets-BSM_wiQD.js";
import { a as resolveIMessageConversationIdFromTarget, i as normalizeIMessageAcpConversationId, n as resolveIMessageInboundConversationId, o as probeIMessage, r as matchIMessageAcpConversation } from "../../sanitize-outbound-CUt9BbvG.js";
import { n as resolveIMessageGroupToolPolicy, t as resolveIMessageGroupRequireMention } from "../../group-policy-DQ1-sfPD.js";
import { n as normalizeIMessageMessagingTarget, t as looksLikeIMessageTargetId } from "../../normalize-DlszlqrX.js";
import { n as createIMessagePluginBase, r as imessageSetupWizard, t as imessagePlugin } from "../../channel-CjienuLn.js";
import { n as testing, t as createIMessageConversationBindingManager } from "../../conversation-bindings-Bf7o1BN7.js";
import { a as imessageSetupAdapter } from "../../setup-core-BhDGa0Rk.js";
import { t as IMESSAGE_LEGACY_OUTBOUND_SEND_DEP_KEYS } from "../../outbound-send-deps-B-QEsLSM.js";
//#region extensions/imessage/src/channel.setup.ts
const imessageSetupPlugin = { ...createIMessagePluginBase({
	setupWizard: imessageSetupWizard,
	setup: imessageSetupAdapter
}) };
//#endregion
export { DEFAULT_IMESSAGE_PROBE_TIMEOUT_MS, IMESSAGE_ACTIONS, IMESSAGE_ACTION_NAMES, IMESSAGE_LEGACY_OUTBOUND_SEND_DEP_KEYS, testing as __testing, testing, createAllowedChatSenderMatcher, createIMessageConversationBindingManager, formatIMessageChatTarget, imessagePlugin, imessageSetupPlugin, inferIMessageTargetChatType, isAllowedIMessageSender, listEnabledIMessageAccounts, listIMessageAccountIds, looksLikeIMessageExplicitTargetId, looksLikeIMessageTargetId, matchIMessageAcpConversation, normalizeIMessageAcpConversationId, normalizeIMessageHandle, normalizeIMessageMessagingTarget, parseChatAllowTargetPrefixes, parseChatTargetPrefixesOrThrow, parseIMessageAllowTarget, parseIMessageTarget, probeIMessage, resolveDefaultIMessageAccountId, resolveIMessageAccount, resolveIMessageConversationIdFromTarget, resolveIMessageGroupRequireMention, resolveIMessageGroupToolPolicy, resolveIMessageInboundConversationId, resolveServicePrefixedAllowTarget, resolveServicePrefixedChatTarget, resolveServicePrefixedOrChatAllowTarget, resolveServicePrefixedTarget };
