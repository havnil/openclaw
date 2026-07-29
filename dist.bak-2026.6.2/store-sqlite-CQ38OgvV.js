import { o as isRecord } from "./record-coerce-DHZ4bFlT.js";
import { d as executeSqliteQuerySync, p as getNodeSqliteKysely } from "./openclaw-state-db-ClQE9OPe.js";
import { n as requireNodeSqlite } from "./sqlite-wal-CAiErlu7.js";
import { u as normalizeAgentId } from "./session-key-B_NoIfpX.js";
import { d as resolveStateDirFromSessionStorePath, n as resolveAgentIdFromSessionStorePath } from "./paths-TD67ZyOm.js";
import { i as resolveOpenClawAgentSqlitePath, n as openOpenClawAgentDatabase, r as runOpenClawAgentWriteTransaction, t as closeOpenClawAgentDatabase } from "./openclaw-agent-db-DE1_sbOs.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
//#region src/config/sessions/store-sqlite.ts
const SESSION_STORE_SCOPE = "session_entries";
function resolveSessionStoreDatabaseOptions(storePath) {
	const structuralStateDir = resolveStateDirFromSessionStorePath(storePath);
	const agentId = resolveAgentIdFromSessionStorePath(storePath) ?? "main";
	if (structuralStateDir) return {
		agentId,
		env: {
			...process.env,
			OPENCLAW_STATE_DIR: structuralStateDir
		}
	};
	const storeDir = path.dirname(path.resolve(storePath));
	const storeHash = crypto.createHash("sha256").update(path.resolve(storePath)).digest("hex");
	return {
		agentId: normalizeAgentId(agentId),
		path: path.join(storeDir, `openclaw-session-store-${storeHash.slice(0, 16)}.sqlite`)
	};
}
function resolveSqliteSessionStoreDatabasePath(storePath) {
	return resolveOpenClawAgentSqlitePath(resolveSessionStoreDatabaseOptions(storePath));
}
function closeSqliteSessionStoreDatabase(storePath) {
	return closeOpenClawAgentDatabase(resolveSessionStoreDatabaseOptions(storePath));
}
function parseSessionEntryValue(raw) {
	if (raw === null) return;
	try {
		const parsed = JSON.parse(raw);
		return isRecord(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function loadSqliteSessionStore(storePath) {
	const database = openOpenClawAgentDatabase(resolveSessionStoreDatabaseOptions(storePath));
	const db = getNodeSqliteKysely(database.db);
	const rows = executeSqliteQuerySync(database.db, db.selectFrom("cache_entries").select([
		"key",
		"value_json",
		"updated_at"
	]).where("scope", "=", SESSION_STORE_SCOPE).orderBy("key", "asc")).rows;
	const store = {};
	for (const row of rows) {
		const entry = parseSessionEntryValue(row.value_json);
		if (entry) store[row.key] = entry;
	}
	return store;
}
function loadExistingSqliteSessionStoreReadOnly(storePath) {
	const databasePath = resolveSqliteSessionStoreDatabasePath(storePath);
	if (!fs.existsSync(databasePath)) return {};
	const sqlite = requireNodeSqlite();
	let database;
	try {
		database = new sqlite.DatabaseSync(databasePath, { readOnly: true });
		if (!database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cache_entries'").get()) return {};
		const rows = database.prepare("SELECT key, value_json FROM cache_entries WHERE scope = ? ORDER BY key ASC").all(SESSION_STORE_SCOPE);
		const store = {};
		for (const row of rows) {
			if (typeof row.key !== "string" || typeof row.value_json !== "string") continue;
			const entry = parseSessionEntryValue(row.value_json);
			if (entry) store[row.key] = entry;
		}
		return store;
	} finally {
		database?.close();
	}
}
function replaceSqliteSessionStore(storePath, store, opts) {
	const databaseOptions = resolveSessionStoreDatabaseOptions(storePath);
	runOpenClawAgentWriteTransaction((database) => {
		const db = getNodeSqliteKysely(database.db);
		executeSqliteQuerySync(database.db, db.deleteFrom("cache_entries").where("scope", "=", SESSION_STORE_SCOPE));
		for (const [key, entry] of Object.entries(store)) {
			const updatedAt = typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now();
			executeSqliteQuerySync(database.db, db.insertInto("cache_entries").values({
				scope: SESSION_STORE_SCOPE,
				key,
				value_json: JSON.stringify(entry),
				blob: null,
				expires_at: null,
				updated_at: updatedAt
			}));
		}
	}, databaseOptions);
	const database = openOpenClawAgentDatabase(databaseOptions);
	if (opts?.compact) database.db.exec("VACUUM;");
	database.walMaintenance.checkpoint();
}
function clearExistingSqliteSessionStore(storePath, opts) {
	if (!fs.existsSync(resolveSqliteSessionStoreDatabasePath(storePath))) return false;
	replaceSqliteSessionStore(storePath, {}, opts);
	return true;
}
function importLegacySessionStoreIntoSqlite(params) {
	replaceSqliteSessionStore(params.storePath, params.store);
	return Object.keys(params.store).length;
}
//#endregion
export { loadSqliteSessionStore as a, loadExistingSqliteSessionStoreReadOnly as i, closeSqliteSessionStoreDatabase as n, replaceSqliteSessionStore as o, importLegacySessionStoreIntoSqlite as r, resolveSqliteSessionStoreDatabasePath as s, clearExistingSqliteSessionStore as t };
