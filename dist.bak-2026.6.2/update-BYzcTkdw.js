import { t as resolveOpenClawPackageRoot } from "./openclaw-root-CNp1Ofdk.js";
import { n as isRestartEnabled } from "./commands.flags-Bx5KKfOp.js";
import { p as scheduleGatewaySigusr1Restart } from "./restart-RsInd5xh.js";
import { t as extractDeliveryInfo } from "./delivery-info-BZtSW2fy.js";
import "./sessions-DZlwceih.js";
import { n as detectRespawnSupervisor } from "./supervisor-markers-DgM0YH9c.js";
import { d as writeRestartSentinel } from "./restart-sentinel-B6-R4GF_.js";
import { nr as validateUpdateStatusParams, tr as validateUpdateRunParams } from "./src-BWAzXRLO.js";
import { s as normalizeUpdateChannel } from "./update-channels-Cv-pxatM.js";
import { r as readPackageVersion } from "./package-json-eYsh2H-B.js";
import { n as runGatewayUpdate, t as resolveUpdateInstallSurface } from "./update-runner-BywxD4AF.js";
import { l as buildUpdateRestartSentinelPayload, t as CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON } from "./update-control-plane-sentinel-BJxPl0vl.js";
import { n as formatManagedServiceUpdateCommand, r as startManagedServiceUpdateHandoff, t as buildManagedServiceHandoffUnavailableMessage } from "./update-managed-service-handoff-Bf6-Hsbx.js";
import { n as resolveControlPlaneActor, t as formatControlPlaneActor } from "./control-plane-audit-CfUQZQQ4.js";
import { t as assertValidParams } from "./validation-CBYMe5bT.js";
import { t as parseRestartRequestParams } from "./restart-request-ss08KcjN.js";
import { n as recordLatestUpdateRestartSentinel, t as getLatestUpdateRestartSentinel } from "./server-restart-sentinel-CW52DZ_G.js";
import os from "node:os";
import { randomUUID } from "node:crypto";
//#region src/gateway/server-methods/update.ts
const SYSTEMD_HANDOFF_RESTART_GRACE_MS = 2e3;
function formatUpdateRunErrorMessage(err) {
	if (err instanceof Error) return err.message || err.name;
	return String(err);
}
function tryResolveProcessCwd() {
	try {
		return process.cwd();
	} catch {
		return;
	}
}
function resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor) {
	if (supervisor !== "systemd") return restartDelayMs;
	return Math.max(restartDelayMs ?? SYSTEMD_HANDOFF_RESTART_GRACE_MS, SYSTEMD_HANDOFF_RESTART_GRACE_MS);
}
const updateHandlers = {
	"update.status": async ({ params, respond }) => {
		if (!assertValidParams(params, validateUpdateStatusParams, "update.status", respond)) return;
		respond(true, { sentinel: getLatestUpdateRestartSentinel() });
	},
	"update.run": async ({ params, respond, client, context }) => {
		if (!assertValidParams(params, validateUpdateRunParams, "update.run", respond)) return;
		const actor = resolveControlPlaneActor(client);
		const { sessionKey, deliveryContext: requestedDeliveryContext, threadId: requestedThreadId, note, continuationMessage, restartDelayMs } = parseRestartRequestParams(params);
		const { deliveryContext: sessionDeliveryContext, threadId: sessionThreadId } = extractDeliveryInfo(sessionKey);
		const deliveryContext = requestedDeliveryContext ?? sessionDeliveryContext;
		const threadId = requestedThreadId ?? sessionThreadId;
		const timeoutMsRaw = params.timeoutMs;
		const timeoutMs = typeof timeoutMsRaw === "number" && Number.isFinite(timeoutMsRaw) ? Math.max(1e3, Math.floor(timeoutMsRaw)) : void 0;
		let result;
		let handoff = null;
		const sentinelMeta = {
			...sessionKey ? { sessionKey } : {},
			...deliveryContext ? { deliveryContext } : {},
			...threadId ? { threadId } : {},
			...note !== void 0 ? { note } : {},
			...continuationMessage !== void 0 ? { continuationMessage } : {}
		};
		let supervisor = null;
		try {
			const config = context.getRuntimeConfig();
			const configChannel = normalizeUpdateChannel(config.update?.channel);
			const invocationCwd = tryResolveProcessCwd();
			const root = await resolveOpenClawPackageRoot({
				moduleUrl: import.meta.url,
				argv1: process.argv[1],
				...invocationCwd ? { cwd: invocationCwd } : {}
			}) ?? invocationCwd ?? os.homedir();
			const installSurface = await resolveUpdateInstallSurface({
				timeoutMs,
				cwd: root,
				argv1: process.argv[1]
			});
			supervisor = detectRespawnSupervisor(process.env, process.platform);
			if (!isRestartEnabled(config) && !supervisor) {
				const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
				result = {
					status: "skipped",
					mode: installSurface.mode,
					...installSurface.root ? { root: installSurface.root } : {},
					reason: installSurface.kind === "global" ? "restart-unavailable" : "restart-disabled",
					...beforeVersion ? { before: { version: beforeVersion } } : {},
					steps: [],
					durationMs: 0
				};
			} else if (installSurface.kind === "global") {
				const command = formatManagedServiceUpdateCommand({
					timeoutMs,
					channel: configChannel ?? void 0
				});
				if (supervisor) try {
					const startedAt = Date.now();
					const handoffId = randomUUID();
					sentinelMeta.handoffId = handoffId;
					const started = await startManagedServiceUpdateHandoff({
						root,
						timeoutMs,
						channel: configChannel ?? void 0,
						restartDelayMs,
						meta: sentinelMeta,
						handoffId,
						supervisor
					});
					handoff = {
						status: "started",
						...started.pid ? { pid: started.pid } : {},
						command: started.command
					};
					const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON,
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [{
							name: "managed-service update handoff",
							command: started.command,
							cwd: root,
							durationMs: Date.now() - startedAt,
							exitCode: null
						}],
						durationMs: Date.now() - startedAt
					};
				} catch (err) {
					context?.logGateway?.warn(`update.run managed-service handoff failed ${formatControlPlaneActor(actor)} error=${formatUpdateRunErrorMessage(err)}`);
					result = {
						status: "error",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-failed",
						steps: [],
						durationMs: 0
					};
				}
				else {
					const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
					handoff = {
						status: "unavailable",
						command,
						message: buildManagedServiceHandoffUnavailableMessage(command)
					};
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-unavailable",
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [],
						durationMs: 0
					};
				}
			} else result = await runGatewayUpdate({
				timeoutMs,
				cwd: root,
				argv1: process.argv[1],
				channel: configChannel ?? void 0
			});
		} catch {
			result = {
				status: "error",
				mode: "unknown",
				reason: "unexpected-error",
				steps: [],
				durationMs: 0
			};
		}
		const payload = buildUpdateRestartSentinelPayload({
			result,
			meta: sentinelMeta
		});
		let sentinelPath;
		try {
			sentinelPath = await writeRestartSentinel(payload);
			recordLatestUpdateRestartSentinel(payload);
		} catch {
			sentinelPath = null;
		}
		const updateWasPackageSwap = result.status === "ok" && result.mode !== "git";
		const restart = handoff?.status === "started" || result.status === "ok" ? scheduleGatewaySigusr1Restart({
			delayMs: handoff?.status === "started" ? resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor) : updateWasPackageSwap ? 0 : restartDelayMs,
			reason: "update.run",
			skipDeferral: updateWasPackageSwap || handoff?.status === "started",
			skipCooldown: updateWasPackageSwap || handoff?.status === "started",
			audit: {
				actor: actor.actor,
				deviceId: actor.deviceId,
				clientIp: actor.clientIp,
				changedPaths: []
			}
		}) : null;
		context?.logGateway?.info(`update.run completed ${formatControlPlaneActor(actor)} changedPaths=<n/a> restartReason=update.run status=${result.status}`);
		if (restart?.coalesced) context?.logGateway?.warn(`update.run restart coalesced ${formatControlPlaneActor(actor)} delayMs=${restart.delayMs}`);
		respond(true, {
			ok: result.status === "ok" || handoff?.status === "started",
			result,
			...handoff ? { handoff } : {},
			restart,
			sentinel: {
				path: sentinelPath,
				payload
			}
		}, void 0);
	}
};
//#endregion
export { updateHandlers };
