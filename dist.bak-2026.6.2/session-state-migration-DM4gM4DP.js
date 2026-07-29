import { i as loadExistingSqliteSessionStoreReadOnly, r as importLegacySessionStoreIntoSqlite, s as resolveSqliteSessionStoreDatabasePath } from "./store-sqlite-CQ38OgvV.js";
import { f as readSessionStoreJson5 } from "./state-migrations-Dv3f3gtQ.js";
import "./session-state-migration-Dwg2EF3I.js";
import fs from "node:fs";
//#region src/commands/session-state-migration.ts
function resolveEntryUpdatedAt(entry) {
	return typeof entry?.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0;
}
function prepareExplicitLegacySessionEntry(entry) {
	const normalized = { ...entry };
	const snapshot = normalized.skillsSnapshot;
	if (snapshot?.resolvedSkills !== void 0) delete snapshot.resolvedSkills;
	return normalized;
}
function mergeExplicitLegacySessionStore(params) {
	const merged = { ...loadExistingSqliteSessionStoreForPreview(params.storePath) };
	for (const [key, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object") continue;
		const incoming = prepareExplicitLegacySessionEntry(entry);
		const existing = merged[key];
		if (!existing || resolveEntryUpdatedAt(incoming) > resolveEntryUpdatedAt(existing)) merged[key] = incoming;
	}
	return merged;
}
function loadExistingSqliteSessionStoreForPreview(storePath) {
	if (!fs.existsSync(resolveSqliteSessionStoreDatabasePath(storePath))) return {};
	try {
		return loadExistingSqliteSessionStoreReadOnly(storePath);
	} catch {
		return {};
	}
}
function loadExplicitSessionStorePreviewForCommand(storePath) {
	if (!fs.existsSync(storePath)) return loadExistingSqliteSessionStoreForPreview(storePath);
	const parsed = readSessionStoreJson5(storePath);
	return parsed.ok ? mergeExplicitLegacySessionStore({
		storePath,
		store: parsed.store
	}) : loadExistingSqliteSessionStoreForPreview(storePath);
}
async function ensureExplicitSessionStoreMigratedForCommand(storePath, opts) {
	if (!fs.existsSync(storePath)) return;
	const parsed = readSessionStoreJson5(storePath);
	if (!parsed.ok) return;
	importLegacySessionStoreIntoSqlite({
		storePath,
		store: mergeExplicitLegacySessionStore({
			storePath,
			store: parsed.store
		})
	});
	try {
		fs.rmSync(storePath, { force: true });
	} catch (error) {
		opts?.onWarning?.(`Imported legacy session store into SQLite, but failed removing ${storePath}: ${String(error)}`);
	}
}
//#endregion
export { loadExplicitSessionStorePreviewForCommand as n, ensureExplicitSessionStoreMigratedForCommand as t };
