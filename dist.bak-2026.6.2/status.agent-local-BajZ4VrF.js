import { w as pathExists } from "./fs-safe-aqmM_n6V.js";
import "./agent-scope-Cs4iFI2N.js";
import { o as resolveAgentWorkspaceDir } from "./agent-scope-config-KLbWcRY1.js";
import { f as resolveStorePath } from "./paths-TD67ZyOm.js";
import { t as ensureSessionStateMigrated } from "./session-state-migration-Dwg2EF3I.js";
import "./session-state-migration-DM4gM4DP.js";
import { n as readSessionStoreReadOnly, t as listGatewayAgentsBasic } from "./agent-list-DpMcNjNE.js";
import path from "node:path";
//#region src/commands/status.agent-local.ts
/** Returns per-agent local workspace, bootstrap, session count, and last activity status. */
async function getAgentLocalStatuses(cfg) {
	await ensureSessionStateMigrated(cfg);
	const agentList = listGatewayAgentsBasic(cfg);
	const now = Date.now();
	const statuses = [];
	for (const agent of agentList.agents) {
		const agentId = agent.id;
		const workspaceDir = (() => {
			try {
				return resolveAgentWorkspaceDir(cfg, agentId);
			} catch {
				return null;
			}
		})();
		const bootstrapPath = workspaceDir != null ? path.join(workspaceDir, "BOOTSTRAP.md") : null;
		const bootstrapPending = bootstrapPath != null ? await pathExists(bootstrapPath) : null;
		const sessionsPath = resolveStorePath(cfg.session?.store, { agentId });
		const store = readSessionStoreReadOnly(sessionsPath);
		const sessions = Object.entries(store).filter(([key]) => key !== "global" && key !== "unknown").map(([, entry]) => entry);
		const sessionsCount = sessions.length;
		const lastUpdatedAt = sessions.reduce((max, e) => Math.max(max, e?.updatedAt ?? 0), 0);
		const resolvedLastUpdatedAt = lastUpdatedAt > 0 ? lastUpdatedAt : null;
		const lastActiveAgeMs = resolvedLastUpdatedAt ? now - resolvedLastUpdatedAt : null;
		statuses.push({
			id: agentId,
			name: agent.name,
			workspaceDir,
			bootstrapPending,
			sessionsPath,
			sessionsCount,
			lastUpdatedAt: resolvedLastUpdatedAt,
			lastActiveAgeMs
		});
	}
	const totalSessions = statuses.reduce((sum, s) => sum + s.sessionsCount, 0);
	const bootstrapPendingCount = statuses.reduce((sum, s) => sum + (s.bootstrapPending ? 1 : 0), 0);
	return {
		defaultId: agentList.defaultId,
		agents: statuses,
		totalSessions,
		bootstrapPendingCount
	};
}
//#endregion
export { getAgentLocalStatuses };
