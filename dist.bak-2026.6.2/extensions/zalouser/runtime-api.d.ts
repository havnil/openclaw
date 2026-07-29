import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { S as MarkdownTableMode } from "../../types.base-D238NWJT.js";
import { o as GroupToolPolicyConfig } from "../../types.tools-DZk2axJU.js";
import { n as isDangerousNameMatchingEnabled } from "../../dangerous-name-matching-B_Cqmdql.js";
import { $n as PluginRuntime, ws as OpenClawPluginToolContext } from "../../types-BJ3mu3UU.js";
import { n as RuntimeEnv } from "../../runtime-Bxifh4bY.js";
import { n as normalizeAccountId, t as DEFAULT_ACCOUNT_ID } from "../../account-id-Dh6XMgGH.js";
import { P as ChannelStatusIssue, m as ChannelGroupContext, r as ChannelAccountSnapshot, t as BaseProbeResult, u as ChannelDirectoryEntry, v as ChannelMessageActionAdapter } from "../../types.core-CZRuyur5.js";
import { c as deliverTextOrMediaReply, p as isNumericTargetId, r as ReplyPayload, t as OutboundReplyPayload, v as resolveSendableOutboundReplyParts, w as sendPayloadWithChunkedTextAndMedia } from "../../reply-payload-wb3lKGla.js";
import { t as ChannelPlugin } from "../../types.plugin-By-iwHAc.js";
import { p as resolveInboundMentionDecision } from "../../mention-gating-D6dFDlTf.js";
import { i as createChannelReplyPipeline } from "../../reply-pipeline-BVvH_NKt.js";
import { a as AnyAgentTool } from "../../plugin-entry-itxMoclV.js";
import { r as buildChannelConfigSchema } from "../../config-schema-jXAeMqcd.js";
import { r as resolvePreferredOpenClawTmpDir } from "../../tmp-openclaw-dir-ubX-9dkk.js";
import { a as warnMissingProviderGroupPolicyFallbackOnce, i as resolveOpenProviderRuntimeGroupPolicy, r as resolveDefaultGroupPolicy } from "../../runtime-group-policy-DEj6LNUz.js";
import { t as buildBaseAccountStatusSnapshot } from "../../status-helpers-DfSmHgNC.js";
import { l as loadOutboundMediaFromUrl } from "../../outbound-media-DGjHHo1-.js";
import { f as mergeAllowlist, m as summarizeMapping, n as formatAllowFromLowercase } from "../../allow-from-DAzkuAuT.js";
import { r as createChannelPairingController } from "../../channel-pairing-Dd94ZNLz.js";
import { t as chunkTextForOutbound } from "../../text-chunking-CuFAtrpW.js";
import { t as zalouserPlugin } from "../../channel-Bc1ZawA5.js";
import { t as zalouserSetupPlugin } from "../../channel.setup-xfaehXdM.js";
import { i as createZalouserTool, n as createZalouserSetupWizardProxy, r as zalouserSetupAdapter, t as zalouserSetupWizard } from "../../api-CCMbxMO7.js";
import { n as isZalouserMutableGroupEntry, t as collectZalouserSecurityAuditFindings } from "../../security-audit-DHVCmSL2.js";

//#region extensions/zalouser/src/runtime.d.ts
declare const setZalouserRuntime: (next: PluginRuntime) => void, getZalouserRuntime: () => PluginRuntime;
//#endregion
export { type AnyAgentTool, type BaseProbeResult, type ChannelAccountSnapshot, type ChannelDirectoryEntry, type ChannelGroupContext, type ChannelMessageActionAdapter, type ChannelPlugin, type ChannelStatusIssue, DEFAULT_ACCOUNT_ID, type GroupToolPolicyConfig, type MarkdownTableMode, type OpenClawConfig, type OpenClawPluginToolContext, type OutboundReplyPayload, type PluginRuntime, type ReplyPayload, type RuntimeEnv, buildBaseAccountStatusSnapshot, buildChannelConfigSchema, chunkTextForOutbound, collectZalouserSecurityAuditFindings, createChannelReplyPipeline as createChannelMessageReplyPipeline, createChannelPairingController, createZalouserSetupWizardProxy, createZalouserTool, deliverTextOrMediaReply, formatAllowFromLowercase, isDangerousNameMatchingEnabled, isNumericTargetId, isZalouserMutableGroupEntry, loadOutboundMediaFromUrl, mergeAllowlist, normalizeAccountId, resolveDefaultGroupPolicy, resolveInboundMentionDecision, resolveOpenProviderRuntimeGroupPolicy, resolvePreferredOpenClawTmpDir, resolveSendableOutboundReplyParts, sendPayloadWithChunkedTextAndMedia, setZalouserRuntime, summarizeMapping, warnMissingProviderGroupPolicyFallbackOnce, zalouserPlugin, zalouserSetupAdapter, zalouserSetupPlugin, zalouserSetupWizard };