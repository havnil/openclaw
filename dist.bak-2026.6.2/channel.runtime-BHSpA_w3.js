import { n as resolveOutboundSendDep } from "./send-deps-DjbvQHZ4.js";
import { a as resolveChannelMediaMaxBytes } from "./media-runtime-CSixP__U.js";
import { t as detectBinary } from "./detect-binary-i7NWaPF2.js";
import { J as setSetupChannelEnabled } from "./setup-wizard-helpers-CoplU_Ox.js";
import { l as createDetectedBinaryStatus } from "./setup-wizard-proxy-CvlL6M1R.js";
import "./setup-Dskh9G3X.js";
import "./setup-tools-DHnws4lp.js";
import "./channel-outbound-Cxfd1Zlm.js";
import { t as PAIRING_APPROVED_MESSAGE } from "./pairing-message-DNhqI-OE.js";
import { a as resolveIMessageAccount, o as resolveIMessageDuplicateSourceOwner } from "./accounts-CW9PeJ5t.js";
import { o as probeIMessage } from "./sanitize-outbound-CUt9BbvG.js";
import { i as imessageDmPolicy, o as imessageSetupStatusBase, r as imessageCompletionNote, t as createIMessageCliPathTextInput } from "./setup-core-BhDGa0Rk.js";
import { t as IMESSAGE_LEGACY_OUTBOUND_SEND_DEP_KEYS } from "./outbound-send-deps-B-QEsLSM.js";
import { t as monitorIMessageProvider } from "./monitor-B5kVsmdU.js";
import { t as sendMessageIMessage } from "./send-1rVydTtt.js";
//#region extensions/imessage/src/setup-surface.ts
const channel = "imessage";
const imessageSetupWizard = {
	channel,
	status: createDetectedBinaryStatus({
		channelLabel: "iMessage",
		binaryLabel: "imsg",
		configuredLabel: imessageSetupStatusBase.configuredLabel,
		unconfiguredLabel: imessageSetupStatusBase.unconfiguredLabel,
		configuredHint: imessageSetupStatusBase.configuredHint,
		unconfiguredHint: imessageSetupStatusBase.unconfiguredHint,
		configuredScore: imessageSetupStatusBase.configuredScore,
		unconfiguredScore: imessageSetupStatusBase.unconfiguredScore,
		resolveConfigured: imessageSetupStatusBase.resolveConfigured,
		resolveBinaryPath: ({ cfg, accountId }) => resolveIMessageAccount({
			cfg,
			accountId
		}).config.cliPath ?? "imsg",
		detectBinary
	}),
	credentials: [],
	textInputs: [createIMessageCliPathTextInput(async ({ currentValue }) => {
		return !await detectBinary(currentValue ?? "imsg");
	})],
	completionNote: imessageCompletionNote,
	dmPolicy: imessageDmPolicy,
	disable: (cfg) => setSetupChannelEnabled(cfg, channel, false)
};
//#endregion
//#region extensions/imessage/src/channel.runtime.ts
async function sendIMessageOutbound(params) {
	const send = resolveOutboundSendDep(params.deps, "imessage", { legacyKeys: IMESSAGE_LEGACY_OUTBOUND_SEND_DEP_KEYS }) ?? sendMessageIMessage;
	const maxBytes = resolveChannelMediaMaxBytes({
		cfg: params.cfg,
		resolveChannelLimitMb: ({ cfg, accountId }) => cfg.channels?.imessage?.accounts?.[accountId]?.mediaMaxMb ?? cfg.channels?.imessage?.mediaMaxMb,
		accountId: params.accountId
	});
	return await send(params.to, params.text, {
		config: params.cfg,
		...params.mediaUrl ? { mediaUrl: params.mediaUrl } : {},
		...params.mediaLocalRoots?.length ? { mediaLocalRoots: params.mediaLocalRoots } : {},
		...params.audioAsVoice ? { audioAsVoice: true } : {},
		maxBytes,
		accountId: params.accountId ?? void 0,
		replyToId: params.replyToId ?? void 0
	});
}
async function notifyIMessageApproval(params) {
	await sendMessageIMessage(params.id, PAIRING_APPROVED_MESSAGE, { config: params.cfg });
}
async function probeIMessageAccount(params) {
	return await probeIMessage(params?.timeoutMs, {
		cliPath: params?.cliPath,
		dbPath: params?.dbPath
	});
}
async function startIMessageGatewayAccount(ctx) {
	const account = ctx.account;
	const cliPath = account.config.cliPath?.trim() || "imsg";
	const dbPath = account.config.dbPath?.trim();
	ctx.setStatus({
		accountId: account.accountId,
		cliPath,
		dbPath: dbPath ?? null
	});
	const ownerAccountId = resolveIMessageDuplicateSourceOwner({
		cfg: ctx.cfg,
		account
	});
	if (ownerAccountId) {
		ctx.log?.info?.(`[${account.accountId}] skipping watcher: duplicate iMessage source; using account "${ownerAccountId}"`);
		if (ctx.abortSignal.aborted) return;
		await new Promise((resolve) => {
			ctx.abortSignal.addEventListener("abort", () => resolve(), { once: true });
		});
		return;
	}
	ctx.log?.info?.(`[${account.accountId}] starting provider (${cliPath}${dbPath ? ` db=${dbPath}` : ""})`);
	return await monitorIMessageProvider({
		accountId: account.accountId,
		config: ctx.cfg,
		runtime: ctx.runtime,
		abortSignal: ctx.abortSignal,
		channelRuntime: ctx.channelRuntime
	});
}
//#endregion
export { imessageSetupWizard, notifyIMessageApproval, probeIMessageAccount, sendIMessageOutbound, startIMessageGatewayAccount };
