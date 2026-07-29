import "./agent-scope-Cs4iFI2N.js";
import { c as resolveDefaultAgentId, n as listAgentIds } from "./agent-scope-config-KLbWcRY1.js";
import { in as errorShape, rn as ErrorCodes } from "./schema-D79YAlfn.js";
import "./src-BWAzXRLO.js";
//#region src/gateway/server-methods/agent-id-shared.ts
/**
* Shared agent-id resolver for request handlers that accept optional agent ids.
*/
function resolveAgentIdOrRespondError(params) {
	const knownAgents = listAgentIds(params.cfg);
	const requestedAgentId = params.normalize(params.rawAgentId) ?? "";
	const agentId = requestedAgentId || resolveDefaultAgentId(params.cfg);
	if (requestedAgentId && !knownAgents.includes(agentId)) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown agent id "${requestedAgentId}"`));
		return null;
	}
	return {
		cfg: params.cfg,
		agentId
	};
}
//#endregion
export { resolveAgentIdOrRespondError as t };
