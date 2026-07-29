import { t as DEFAULT_ACCOUNT_ID } from "../../account-id-Df9e41E6.js";
import { r as buildChannelConfigSchema } from "../../config-schema-BtYVhZQA.js";
import { p as formatTrimmedAllowFromEntries } from "../../channel-config-helpers-lj5quus3.js";
import { a as resolveChannelMediaMaxBytes } from "../../media-runtime-CSixP__U.js";
import { t as chunkTextForOutbound } from "../../text-chunking-D45TeeEs.js";
import { c as getChatChannelMeta } from "../../core-CJYgdGco.js";
import { t as PAIRING_APPROVED_MESSAGE } from "../../pairing-message-DNhqI-OE.js";
import { c as collectStatusIssuesFromLastError, r as buildComputedAccountStatusSnapshot } from "../../status-helpers-BevxX6Pu.js";
import "../../channel-status-DxlXr0Xh.js";
import { i as IMessageConfigSchema } from "../../bundled-channel-config-schema-DdNaBuhs.js";
import { a as resolveIMessageAccount } from "../../accounts-CW9PeJ5t.js";
import { f as setIMessageRuntime } from "../../monitor-reply-cache-Dm0YfVOH.js";
import { o as probeIMessage } from "../../sanitize-outbound-CUt9BbvG.js";
import { n as resolveIMessageGroupToolPolicy, r as imessageMessageActions, t as resolveIMessageGroupRequireMention } from "../../group-policy-DQ1-sfPD.js";
import { n as normalizeIMessageMessagingTarget, t as looksLikeIMessageTargetId } from "../../normalize-DlszlqrX.js";
import "../../config-api-Clq0KB8q.js";
import { t as monitorIMessageProvider } from "../../monitor-B5kVsmdU.js";
import { t as sendMessageIMessage } from "../../send-1rVydTtt.js";
//#region extensions/imessage/src/config-accessors.ts
function resolveIMessageConfigAllowFrom(params) {
	return (resolveIMessageAccount(params).config.allowFrom ?? []).map((entry) => String(entry));
}
function resolveIMessageConfigDefaultTo(params) {
	const defaultTo = resolveIMessageAccount(params).config.defaultTo;
	if (defaultTo == null) return;
	return defaultTo.trim() || void 0;
}
//#endregion
export { DEFAULT_ACCOUNT_ID, IMessageConfigSchema, PAIRING_APPROVED_MESSAGE, buildChannelConfigSchema, buildComputedAccountStatusSnapshot, chunkTextForOutbound, collectStatusIssuesFromLastError, formatTrimmedAllowFromEntries, getChatChannelMeta, imessageMessageActions, looksLikeIMessageTargetId, monitorIMessageProvider, normalizeIMessageMessagingTarget, probeIMessage, resolveChannelMediaMaxBytes, resolveIMessageConfigAllowFrom, resolveIMessageConfigDefaultTo, resolveIMessageGroupRequireMention, resolveIMessageGroupToolPolicy, sendMessageIMessage, setIMessageRuntime };
