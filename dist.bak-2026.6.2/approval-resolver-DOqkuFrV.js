import { t as isApprovalNotFoundError } from "./approval-errors-Cl3t2MJo.js";
import "./error-runtime-AW3TpCjn.js";
import { t as resolveApprovalOverGateway } from "./approval-gateway-resolver-BAvOToOT.js";
import "./approval-gateway-runtime-Bbju3rPu.js";
//#region extensions/signal/src/approval-resolver.ts
async function resolveSignalApproval(params) {
	await resolveApprovalOverGateway({
		cfg: params.cfg,
		approvalId: params.approvalId,
		decision: params.decision,
		senderId: params.senderId,
		gatewayUrl: params.gatewayUrl,
		clientDisplayName: `Signal approval (${params.senderId?.trim() || "unknown"})`
	});
}
//#endregion
export { isApprovalNotFoundError, resolveSignalApproval };
