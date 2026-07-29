import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-mnp54Vah.js";
import { i as normalizeHyphenSlug } from "./string-normalization-WNUDCpXX.js";
import { t as createSubsystemLogger } from "./subsystem-CLsYac3M.js";
import { s as normalizeSessionPeerId } from "./session-key-utils-Bx3apsJ3.js";
import { f as resolveAgentIdFromSessionKey } from "./session-key-B_NoIfpX.js";
import { i as getRuntimeConfig } from "./io-ET-UkTrJ.js";
import { i as mergeDeliveryContext, n as deliveryContextFromSession, o as normalizeDeliveryContext, s as normalizeSessionDeliveryFields, t as deliveryContextFromChannelRoute } from "./delivery-context.shared-3a5Ar2cB.js";
import { _ as isSessionArchiveArtifactName, a as resolveSessionFilePath, f as resolveStorePath, g as isPrimarySessionTranscriptFileName, h as isCompactionCheckpointTranscriptFileName, v as isSessionStoreTempArtifactName, x as isTrajectorySessionArtifactName } from "./paths-TD67ZyOm.js";
import { A as pruneQuotaSuspensions, H as resolveSessionStoreEntry, N as shouldPreserveMaintenanceEntry, O as capEntryCount, P as shouldRunSessionEntryMaintenance, S as writeSessionStoreCache, b as setSerializedSessionStore, d as clearSessionStoreCaches, f as cloneSessionStoreRecord, g as getSerializedSessionStorePromptRefs, h as getSerializedSessionStore, i as readSessionEntry, j as pruneStaleEntries, k as getActiveSessionMaintenanceWarning, m as dropSessionStoreSnapshotCache, n as normalizeSessionStore, o as resolveMaintenanceConfig, p as dropSessionStoreObjectCache, r as readSessionEntries, s as collectSessionMaintenancePreserveKeys, t as loadSessionStore, u as getSessionStoreFreshnessSnapshot, v as invalidateSessionStoreCache, x as takeMutableSessionStoreCache, y as isSessionStoreCacheEnabled } from "./store-load-DZP7FIL2.js";
import { a as resolveTrajectoryPointerFilePath, i as resolveTrajectoryFilePath } from "./paths-Biq9XkB5.js";
import { a as normalizeChannelId, i as listChannelPlugins, n as getLoadedChannelPlugin } from "./registry-CFlZM--p.js";
import { a as loadSqliteSessionStore, o as replaceSqliteSessionStore, s as resolveSqliteSessionStoreDatabasePath } from "./store-sqlite-CQ38OgvV.js";
import { t as normalizeChatType } from "./chat-type-CxEvM45e.js";
import { t as resolveConversationLabel } from "./conversation-label-DGft15kz.js";
import "./plugins-tGHyR0wY.js";
import { i as normalizeMessageChannel, r as listDeliverableMessageChannels } from "./message-channel-normalize-DhphqsX3.js";
import "./message-channel-B3OprsLe.js";
import { i as mergeSessionEntryPreserveActivity, r as mergeSessionEntry } from "./types-D8S_uNvu.js";
import { n as runQueuedStoreWrite, t as clearStoreWriterQueuesForTest } from "./store-writer-queue-Cs_NM_XG.js";
import fs from "node:fs";
import path from "node:path";
//#region src/config/sessions/disk-budget.ts
const NOOP_LOGGER = {
	warn: () => {},
	info: () => {}
};
function canonicalizePathForComparison(filePath) {
	const resolved = path.resolve(filePath);
	try {
		return fs.realpathSync(resolved);
	} catch {
		return resolved;
	}
}
function measureSqliteSessionEntryBytes(key, entry) {
	return Buffer.byteLength(key, "utf-8") + Buffer.byteLength(JSON.stringify(entry), "utf-8");
}
function measureSqliteSessionStoreBytes(store) {
	let bytes = 0;
	for (const [key, entry] of Object.entries(store)) bytes += measureSqliteSessionEntryBytes(key, entry);
	return bytes;
}
function buildSqliteSessionEntrySizeMap(store) {
	const out = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(store)) out.set(key, measureSqliteSessionEntryBytes(key, entry));
	return out;
}
function resolveProjectedPromptBlobHash(entry) {
	const ref = entry?.skillsSnapshot?.promptRef;
	return ref?.algorithm === "sha256" && typeof ref.hash === "string" ? ref.hash : void 0;
}
function addPromptBlobRef(refs, sessionKey, hash) {
	if (!hash) return;
	const existingHashes = refs.hashesBySessionKey.get(sessionKey);
	if (existingHashes?.includes(hash)) return;
	if (existingHashes) existingHashes.push(hash);
	else refs.hashesBySessionKey.set(sessionKey, [hash]);
	refs.refCounts.set(hash, (refs.refCounts.get(hash) ?? 0) + 1);
}
function buildProjectedPromptBlobRefs(store) {
	const refs = {
		refCounts: /* @__PURE__ */ new Map(),
		hashesBySessionKey: /* @__PURE__ */ new Map()
	};
	for (const [sessionKey, entry] of Object.entries(store)) addPromptBlobRef(refs, sessionKey, resolveProjectedPromptBlobHash(entry));
	return refs;
}
function mergePromptBlobRefs(into, store) {
	for (const [sessionKey, entry] of Object.entries(store)) addPromptBlobRef(into, sessionKey, resolveProjectedPromptBlobHash(entry));
	return into;
}
function buildLivePromptBlobRefs(params) {
	const refs = buildProjectedPromptBlobRefs(params.store);
	try {
		mergePromptBlobRefs(refs, loadSqliteSessionStore(params.storePath));
	} catch {}
	return refs;
}
function getEntryUpdatedAt(entry) {
	if (!entry) return 0;
	const updatedAt = entry.updatedAt;
	return Number.isFinite(updatedAt) ? updatedAt : 0;
}
function buildSessionIdRefCounts(store) {
	const counts = /* @__PURE__ */ new Map();
	for (const entry of Object.values(store)) {
		const sessionId = entry?.sessionId;
		if (!sessionId) continue;
		counts.set(sessionId, (counts.get(sessionId) ?? 0) + 1);
	}
	return counts;
}
function resolveSessionTranscriptPathForEntry(params) {
	if (!params.entry.sessionId) return null;
	try {
		const resolved = resolveSessionFilePath(params.entry.sessionId, params.entry, { sessionsDir: params.sessionsDir });
		const resolvedSessionsDir = canonicalizePathForComparison(params.sessionsDir);
		const resolvedPath = canonicalizePathForComparison(resolved);
		const relative = path.relative(resolvedSessionsDir, resolvedPath);
		if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
		return resolvedPath;
	} catch {
		return null;
	}
}
function resolveSessionArtifactPathsForEntry(params) {
	const transcriptPath = resolveSessionTranscriptPathForEntry(params);
	if (!transcriptPath) return [];
	const paths = [transcriptPath];
	if (params.entry.sessionId) {
		paths.push(resolveTrajectoryPointerFilePath(transcriptPath));
		paths.push(resolveTrajectoryFilePath({
			env: {},
			sessionFile: transcriptPath,
			sessionId: params.entry.sessionId
		}));
	}
	return paths;
}
function resolveSessionArtifactCanonicalPathsForEntry(params) {
	return resolveSessionArtifactPathsForEntry(params).map(canonicalizePathForComparison);
}
function resolveReferencedSessionArtifactPaths(params) {
	const referenced = /* @__PURE__ */ new Set();
	const resolvedSessionsDir = canonicalizePathForComparison(params.sessionsDir);
	for (const entry of Object.values(params.store)) {
		for (const resolved of resolveSessionArtifactCanonicalPathsForEntry({
			sessionsDir: params.sessionsDir,
			entry
		})) referenced.add(resolved);
		for (const checkpoint of entry.compactionCheckpoints ?? []) {
			const checkpointFiles = [checkpoint.preCompaction.sessionFile?.trim(), checkpoint.postCompaction.sessionFile?.trim()].filter((filePath) => Boolean(filePath));
			for (const checkpointFile of checkpointFiles) {
				const resolvedCheckpointPath = canonicalizePathForComparison(checkpointFile);
				const relative = path.relative(resolvedSessionsDir, resolvedCheckpointPath);
				if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) referenced.add(resolvedCheckpointPath);
			}
		}
	}
	return referenced;
}
async function readSessionsDirFiles(sessionsDir) {
	const dirEntries = await fs.promises.readdir(sessionsDir, { withFileTypes: true }).catch(() => []);
	const files = [];
	for (const dirent of dirEntries) {
		if (!dirent.isFile()) continue;
		const filePath = path.join(sessionsDir, dirent.name);
		const stat = await fs.promises.stat(filePath).catch(() => null);
		if (!stat?.isFile()) continue;
		files.push({
			path: filePath,
			canonicalPath: canonicalizePathForComparison(filePath),
			name: dirent.name,
			size: stat.size,
			mtimeMs: stat.mtimeMs
		});
	}
	return files;
}
async function readSqliteSessionStoreFiles(storePath) {
	const sqlitePath = resolveSqliteSessionStoreDatabasePath(storePath);
	const candidates = [
		sqlitePath,
		`${sqlitePath}-wal`,
		`${sqlitePath}-shm`,
		`${sqlitePath}-journal`
	];
	const files = [];
	for (const filePath of candidates) {
		const stat = await fs.promises.stat(filePath).catch(() => null);
		if (!stat?.isFile()) continue;
		files.push({
			path: filePath,
			canonicalPath: canonicalizePathForComparison(filePath),
			name: path.basename(filePath),
			size: stat.size,
			mtimeMs: stat.mtimeMs
		});
	}
	return files;
}
function uniqueFilesByCanonicalPath(files) {
	const byPath = /* @__PURE__ */ new Map();
	for (const file of files) byPath.set(file.canonicalPath, file);
	return [...byPath.values()];
}
async function readSessionPromptBlobFiles(sessionsDir) {
	const root = path.join(sessionsDir, "skills-prompts", "sha256");
	const prefixEntries = await fs.promises.readdir(root, { withFileTypes: true }).catch(() => []);
	const files = [];
	for (const prefixEntry of prefixEntries) {
		if (!prefixEntry.isDirectory() || !/^[a-f0-9]{2}$/u.test(prefixEntry.name)) continue;
		const prefixDir = path.join(root, prefixEntry.name);
		const blobEntries = await fs.promises.readdir(prefixDir, { withFileTypes: true }).catch(() => []);
		for (const blobEntry of blobEntries) {
			if (!blobEntry.isFile() || !/^[a-f0-9]{64}\.txt$/u.test(blobEntry.name) && !isSessionPromptBlobTempArtifactName(blobEntry.name)) continue;
			const filePath = path.join(prefixDir, blobEntry.name);
			const stat = await fs.promises.stat(filePath).catch(() => null);
			if (!stat?.isFile()) continue;
			files.push({
				path: filePath,
				canonicalPath: canonicalizePathForComparison(filePath),
				name: blobEntry.name,
				size: stat.size,
				mtimeMs: stat.mtimeMs
			});
		}
	}
	return files;
}
function resolvePromptBlobFileHash(file) {
	return /^[a-f0-9]{64}\.txt$/u.test(file.name) ? file.name.slice(0, -4) : void 0;
}
function isSessionPromptBlobTempArtifactName(name) {
	return /^[a-f0-9]{64}\.txt\.(?:\d+\.)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tmp$/u.test(name);
}
function isUnreferencedSessionArtifactFile(file, referencedPaths) {
	if (referencedPaths.has(file.canonicalPath)) return false;
	return isCompactionCheckpointTranscriptFileName(file.name) || isTrajectorySessionArtifactName(file.name) || isPrimarySessionTranscriptFileName(file.name);
}
const SESSION_STORE_TEMP_STALE_MS = 300 * 1e3;
const SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS = SESSION_STORE_TEMP_STALE_MS;
function isUnreferencedPromptBlobFileRemovable(file, projectedPromptBlobRefCounts, cutoffMs) {
	if (file.mtimeMs > cutoffMs) return false;
	const hash = resolvePromptBlobFileHash(file);
	return hash ? !projectedPromptBlobRefCounts.has(hash) : false;
}
function isPromptBlobArtifactRemovable(file, projectedPromptBlobRefCounts, promptBlobCutoffMs, tempCutoffMs) {
	if (isSessionPromptBlobTempArtifactName(file.name)) return file.mtimeMs <= tempCutoffMs;
	return isUnreferencedPromptBlobFileRemovable(file, projectedPromptBlobRefCounts, promptBlobCutoffMs);
}
function isDiskBudgetRemovableSessionFile(file, referencedPaths, tempStaleCutoffMs, storeBasename) {
	if (isSessionStoreTempArtifactName(file.name, storeBasename)) return file.mtimeMs <= tempStaleCutoffMs;
	return isSessionArchiveArtifactName(file.name) || isUnreferencedSessionArtifactFile(file, referencedPaths);
}
async function removeFileIfExists(filePath) {
	const stat = await fs.promises.stat(filePath).catch(() => null);
	if (!stat?.isFile()) return 0;
	await fs.promises.rm(filePath, { force: true }).catch(() => void 0);
	return stat.size;
}
async function removeFileForBudget(params) {
	const resolvedPath = path.resolve(params.filePath);
	const canonicalPath = params.canonicalPath ?? canonicalizePathForComparison(resolvedPath);
	if (params.dryRun) {
		if (params.simulatedRemovedPaths.has(canonicalPath)) return 0;
		const size = params.fileSizesByPath.get(canonicalPath) ?? 0;
		if (size <= 0) return 0;
		params.simulatedRemovedPaths.add(canonicalPath);
		params.onRemovedPath?.(canonicalPath);
		return size;
	}
	const size = await removeFileIfExists(resolvedPath);
	if (size > 0) params.onRemovedPath?.(canonicalPath);
	return size;
}
async function removePromptBlobFileForBudget(params) {
	let file = params.file;
	if (!params.dryRun) {
		const stat = await fs.promises.stat(file.path).catch(() => null);
		if (!stat?.isFile()) return 0;
		file = {
			...file,
			size: stat.size,
			mtimeMs: stat.mtimeMs
		};
	}
	if (!isPromptBlobArtifactRemovable(file, params.projectedPromptBlobRefCounts, params.promptBlobCutoffMs, params.tempCutoffMs)) return 0;
	return await removeFileForBudget({
		filePath: file.path,
		canonicalPath: file.canonicalPath,
		dryRun: params.dryRun,
		fileSizesByPath: params.fileSizesByPath,
		simulatedRemovedPaths: params.simulatedRemovedPaths,
		onRemovedPath: params.onRemovedPath
	});
}
async function pruneUnreferencedSessionArtifacts(params) {
	const olderThanMs = Number.isFinite(params.olderThanMs) && params.olderThanMs > 0 ? params.olderThanMs : 0;
	const sessionsDir = path.dirname(params.storePath);
	const files = await readSessionsDirFiles(sessionsDir);
	const promptBlobFiles = await readSessionPromptBlobFiles(sessionsDir);
	const fileSizesByPath = new Map([...files, ...promptBlobFiles].map((file) => [file.canonicalPath, file.size]));
	const simulatedRemovedPaths = /* @__PURE__ */ new Set();
	const referencedPaths = resolveReferencedSessionArtifactPaths({
		sessionsDir,
		store: params.store
	});
	const projectedPromptBlobRefs = buildLivePromptBlobRefs({
		store: params.store,
		storePath: params.storePath
	});
	const cutoffMs = Date.now() - olderThanMs;
	const tempCutoffMs = Date.now() - SESSION_STORE_TEMP_STALE_MS;
	const promptBlobCutoffMs = Date.now() - Math.max(olderThanMs, SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS);
	const storeBasename = path.basename(params.storePath);
	const removableStoreFiles = files.filter((file) => {
		if (params.excludeCanonicalPaths?.has(file.canonicalPath)) return false;
		if (isSessionStoreTempArtifactName(file.name, storeBasename)) return file.mtimeMs <= tempCutoffMs;
		return file.mtimeMs <= cutoffMs && isUnreferencedSessionArtifactFile(file, referencedPaths);
	});
	const removablePromptBlobFiles = promptBlobFiles.filter((file) => {
		if (params.excludeCanonicalPaths?.has(file.canonicalPath)) return false;
		return isPromptBlobArtifactRemovable(file, projectedPromptBlobRefs.refCounts, promptBlobCutoffMs, tempCutoffMs);
	});
	const removableFiles = [...removableStoreFiles.map((file) => ({
		kind: "store",
		file
	})), ...removablePromptBlobFiles.map((file) => ({
		kind: "promptBlob",
		file
	}))].filter((file) => {
		return !params.excludeCanonicalPaths?.has(file.file.canonicalPath);
	}).toSorted((a, b) => a.file.mtimeMs - b.file.mtimeMs);
	let removedFiles = 0;
	let freedBytes = 0;
	const dryRun = params.dryRun === true;
	for (const item of removableFiles) {
		const deletedBytes = item.kind === "promptBlob" ? await removePromptBlobFileForBudget({
			file: item.file,
			projectedPromptBlobRefCounts: projectedPromptBlobRefs.refCounts,
			promptBlobCutoffMs,
			tempCutoffMs,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths
		}) : await removeFileForBudget({
			filePath: item.file.path,
			canonicalPath: item.file.canonicalPath,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths
		});
		if (deletedBytes <= 0) continue;
		removedFiles += 1;
		freedBytes += deletedBytes;
	}
	return {
		scannedFiles: files.length + promptBlobFiles.length,
		removedFiles,
		freedBytes,
		olderThanMs
	};
}
async function enforceSessionDiskBudget(params) {
	const maxBytes = params.maintenance.maxDiskBytes;
	const highWaterBytes = params.maintenance.highWaterBytes;
	if (maxBytes == null || highWaterBytes == null) return null;
	const log = params.log ?? NOOP_LOGGER;
	const dryRun = params.dryRun === true;
	const sessionsDir = path.dirname(params.storePath);
	const files = await readSessionsDirFiles(sessionsDir);
	const promptBlobFiles = await readSessionPromptBlobFiles(sessionsDir);
	const sqliteFiles = await readSqliteSessionStoreFiles(params.storePath);
	const allCurrentFiles = uniqueFilesByCanonicalPath([
		...files,
		...promptBlobFiles,
		...sqliteFiles
	]);
	const fileSizesByPath = new Map(allCurrentFiles.map((file) => [file.canonicalPath, file.size]));
	const simulatedRemovedPaths = /* @__PURE__ */ new Set();
	const resolvedStorePath = canonicalizePathForComparison(params.storePath);
	const storeFile = files.find((file) => file.canonicalPath === resolvedStorePath);
	const currentSqliteBytes = sqliteFiles.reduce((sum, file) => sum + file.size, 0);
	let projectedSqliteBytes = measureSqliteSessionStoreBytes(params.store);
	let sqliteBudgetBytes = projectedSqliteBytes;
	const existingPromptBlobFilesByHash = /* @__PURE__ */ new Map();
	for (const file of promptBlobFiles) {
		const hash = resolvePromptBlobFileHash(file);
		if (hash) existingPromptBlobFilesByHash.set(hash, file);
	}
	const projectedPromptBlobRefs = buildLivePromptBlobRefs({
		store: params.store,
		storePath: params.storePath
	});
	let total = allCurrentFiles.reduce((sum, file) => sum + file.size, 0) - (storeFile?.size ?? 0) - currentSqliteBytes + sqliteBudgetBytes;
	const totalBefore = total;
	if (total <= maxBytes) return {
		totalBytesBefore: totalBefore,
		totalBytesAfter: total,
		removedFiles: 0,
		removedEntries: 0,
		freedBytes: 0,
		maxBytes,
		highWaterBytes,
		overBudget: false
	};
	if (params.warnOnly) {
		log.warn("session disk budget exceeded (warn-only mode)", {
			sessionsDir,
			totalBytes: total,
			maxBytes,
			highWaterBytes
		});
		return {
			totalBytesBefore: totalBefore,
			totalBytesAfter: total,
			removedFiles: 0,
			removedEntries: 0,
			freedBytes: 0,
			maxBytes,
			highWaterBytes,
			overBudget: true
		};
	}
	let removedFiles = 0;
	let removedEntries = 0;
	let freedBytes = 0;
	const referencedPaths = resolveReferencedSessionArtifactPaths({
		sessionsDir,
		store: params.store
	});
	const tempStaleCutoffMs = Date.now() - SESSION_STORE_TEMP_STALE_MS;
	const promptBlobOrphanCutoffMs = Date.now() - SESSION_PROMPT_BLOB_UNREFERENCED_GRACE_MS;
	const storeBasename = path.basename(params.storePath);
	const unreferencedPromptBlobQueue = promptBlobFiles.filter((file) => {
		return isPromptBlobArtifactRemovable(file, projectedPromptBlobRefs.refCounts, promptBlobOrphanCutoffMs, tempStaleCutoffMs);
	}).toSorted((a, b) => a.mtimeMs - b.mtimeMs);
	for (const file of unreferencedPromptBlobQueue) {
		if (total <= highWaterBytes) break;
		const deletedBytes = await removePromptBlobFileForBudget({
			file,
			projectedPromptBlobRefCounts: projectedPromptBlobRefs.refCounts,
			promptBlobCutoffMs: promptBlobOrphanCutoffMs,
			tempCutoffMs: tempStaleCutoffMs,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths,
			onRemovedPath: params.onRemoveFile
		});
		if (deletedBytes <= 0) continue;
		total -= deletedBytes;
		freedBytes += deletedBytes;
		removedFiles += 1;
	}
	const removableFileQueue = files.filter((file) => isDiskBudgetRemovableSessionFile(file, referencedPaths, tempStaleCutoffMs, storeBasename)).toSorted((a, b) => a.mtimeMs - b.mtimeMs);
	for (const file of removableFileQueue) {
		if (total <= highWaterBytes) break;
		const deletedBytes = await removeFileForBudget({
			filePath: file.path,
			canonicalPath: file.canonicalPath,
			dryRun,
			fileSizesByPath,
			simulatedRemovedPaths,
			onRemovedPath: params.onRemoveFile
		});
		if (deletedBytes <= 0) continue;
		total -= deletedBytes;
		freedBytes += deletedBytes;
		removedFiles += 1;
	}
	if (total > highWaterBytes) {
		const activeSessionKey = normalizeOptionalLowercaseString(params.activeSessionKey);
		const sessionIdRefCounts = buildSessionIdRefCounts(params.store);
		const sqliteEntryBytesByKey = buildSqliteSessionEntrySizeMap(params.store);
		const keys = Object.keys(params.store).toSorted((a, b) => {
			return getEntryUpdatedAt(params.store[a]) - getEntryUpdatedAt(params.store[b]);
		});
		for (const key of keys) {
			if (total <= highWaterBytes) break;
			if (activeSessionKey && normalizeLowercaseStringOrEmpty(key) === activeSessionKey) continue;
			const entry = params.store[key];
			if (!entry) continue;
			if (shouldPreserveMaintenanceEntry({
				key,
				entry,
				preserveKeys: params.preserveKeys
			})) continue;
			const promptBlobHashes = projectedPromptBlobRefs.hashesBySessionKey.get(key) ?? [];
			delete params.store[key];
			projectedPromptBlobRefs.hashesBySessionKey.delete(key);
			const previousSqliteBudgetBytes = sqliteBudgetBytes;
			const entryBytes = sqliteEntryBytesByKey.get(key);
			sqliteEntryBytesByKey.delete(key);
			if (typeof entryBytes === "number" && Number.isFinite(entryBytes) && entryBytes >= 0) projectedSqliteBytes = Math.max(0, projectedSqliteBytes - entryBytes);
			else projectedSqliteBytes = measureSqliteSessionStoreBytes(params.store);
			sqliteBudgetBytes = projectedSqliteBytes;
			total += sqliteBudgetBytes - previousSqliteBudgetBytes;
			for (const promptBlobHash of promptBlobHashes) {
				const nextRefCount = (projectedPromptBlobRefs.refCounts.get(promptBlobHash) ?? 1) - 1;
				if (nextRefCount > 0) projectedPromptBlobRefs.refCounts.set(promptBlobHash, nextRefCount);
				else {
					projectedPromptBlobRefs.refCounts.delete(promptBlobHash);
					const blobFile = existingPromptBlobFilesByHash.get(promptBlobHash);
					if (blobFile && isPromptBlobArtifactRemovable(blobFile, projectedPromptBlobRefs.refCounts, promptBlobOrphanCutoffMs, tempStaleCutoffMs)) {
						const deletedBytes = await removePromptBlobFileForBudget({
							file: blobFile,
							projectedPromptBlobRefCounts: projectedPromptBlobRefs.refCounts,
							promptBlobCutoffMs: promptBlobOrphanCutoffMs,
							tempCutoffMs: tempStaleCutoffMs,
							dryRun,
							fileSizesByPath,
							simulatedRemovedPaths,
							onRemovedPath: params.onRemoveFile
						});
						if (deletedBytes > 0) {
							total -= deletedBytes;
							freedBytes += deletedBytes;
							removedFiles += 1;
						}
					}
				}
			}
			removedEntries += 1;
			const sessionId = entry.sessionId;
			if (!sessionId) continue;
			const nextRefCount = (sessionIdRefCounts.get(sessionId) ?? 1) - 1;
			if (nextRefCount > 0) {
				sessionIdRefCounts.set(sessionId, nextRefCount);
				continue;
			}
			sessionIdRefCounts.delete(sessionId);
			for (const artifactPath of resolveSessionArtifactPathsForEntry({
				sessionsDir,
				entry
			})) {
				const deletedBytes = await removeFileForBudget({
					filePath: artifactPath,
					dryRun,
					fileSizesByPath,
					simulatedRemovedPaths,
					onRemovedPath: params.onRemoveFile
				});
				if (deletedBytes <= 0) continue;
				total -= deletedBytes;
				freedBytes += deletedBytes;
				removedFiles += 1;
			}
		}
	}
	if (!dryRun) {
		if (total > highWaterBytes) log.warn("session disk budget still above high-water target after cleanup", {
			sessionsDir,
			totalBytes: total,
			maxBytes,
			highWaterBytes,
			removedFiles,
			removedEntries
		});
		else if (removedFiles > 0 || removedEntries > 0) log.info("applied session disk budget cleanup", {
			sessionsDir,
			totalBytesBefore: totalBefore,
			totalBytesAfter: total,
			maxBytes,
			highWaterBytes,
			removedFiles,
			removedEntries
		});
	}
	return {
		totalBytesBefore: totalBefore,
		totalBytesAfter: total,
		removedFiles,
		removedEntries,
		freedBytes,
		maxBytes,
		highWaterBytes,
		overBudget: true
	};
}
//#endregion
//#region src/config/sessions/group.ts
const getGroupSurfaces = () => new Set([...listDeliverableMessageChannels(), "webchat"]);
function resolveLegacyGroupSessionKey(ctx) {
	for (const plugin of listChannelPlugins()) {
		const resolved = plugin.messaging?.resolveLegacyGroupSessionKey?.(ctx);
		if (resolved) return resolved;
	}
	return null;
}
function normalizeGroupLabel(raw) {
	return normalizeHyphenSlug(raw);
}
function resolveOriginatingGroupTargetId(params) {
	const target = normalizeOptionalString(params.ctx.OriginatingTo ?? params.ctx.To) ?? "";
	if (!target) return null;
	const parts = target.split(":").filter(Boolean);
	if (parts.length < 2) return null;
	const head = normalizeLowercaseStringOrEmpty(parts[0]);
	const second = normalizeOptionalLowercaseString(parts[1]);
	if ((second === "group" || second === "channel") && (head === params.provider || getGroupSurfaces().has(head))) return parts.slice(2).join(":") || null;
	if (head === params.provider || head === "chat" || head === "room" || head === "group") return parts.slice(1).join(":") || null;
	if (head === "channel") return parts.slice(1).join(":") || null;
	return null;
}
function shortenGroupId(value) {
	const trimmed = normalizeOptionalString(value) ?? "";
	if (!trimmed) return "";
	if (trimmed.length <= 14) return trimmed;
	return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
/** Builds a compact display label for group sessions from channel metadata or ids. */
function buildGroupDisplayName(params) {
	const providerKey = normalizeOptionalLowercaseString(params.provider) ?? "group";
	const groupChannel = normalizeOptionalString(params.groupChannel);
	const space = normalizeOptionalString(params.space);
	const subject = normalizeOptionalString(params.subject);
	const detail = (groupChannel && space ? `${space}${groupChannel.startsWith("#") ? "" : "#"}${groupChannel}` : groupChannel || subject || space || "") || "";
	const fallbackId = normalizeOptionalString(params.id) ?? params.key;
	const rawLabel = detail || fallbackId;
	let token = normalizeGroupLabel(rawLabel);
	if (!token) token = normalizeGroupLabel(shortenGroupId(rawLabel));
	if (!params.groupChannel && token.startsWith("#")) token = token.replace(/^#+/, "");
	if (token && !/^[@#]/.test(token) && !token.startsWith("g-") && !token.includes("#")) token = `g-${token}`;
	return token ? `${providerKey}:${token}` : providerKey;
}
/**
* Resolves channel/group chat context into the persisted group session key.
*
* Provider-prefixed ids use channel-owned normalization, while legacy plugin resolvers remain a
* fallback for older channel surfaces that cannot yet express the generic route shape.
*/
function resolveGroupSessionKey(ctx) {
	const from = normalizeOptionalString(ctx.From) ?? "";
	const chatType = normalizeOptionalLowercaseString(ctx.ChatType);
	const normalizedChatType = chatType === "channel" ? "channel" : chatType === "group" ? "group" : void 0;
	const legacyResolution = resolveLegacyGroupSessionKey(ctx);
	if (!(normalizedChatType === "group" || normalizedChatType === "channel" || from.includes(":group:") || from.includes(":channel:") || legacyResolution !== null)) return null;
	const providerHint = normalizeOptionalLowercaseString(ctx.Provider);
	const parts = from.split(":").filter(Boolean);
	const head = normalizeLowercaseStringOrEmpty(parts[0]);
	const headIsSurface = head ? getGroupSurfaces().has(head) : false;
	if (!headIsSurface && !providerHint && legacyResolution) return legacyResolution;
	const provider = headIsSurface ? head : providerHint ?? legacyResolution?.channel;
	if (!provider) return null;
	const second = normalizeOptionalLowercaseString(parts[1]);
	const secondIsKind = second === "group" || second === "channel";
	const kind = secondIsKind ? second : from.includes(":channel:") || normalizedChatType === "channel" ? "channel" : "group";
	const originatingGroupTargetId = !secondIsKind && normalizedChatType ? resolveOriginatingGroupTargetId({
		ctx,
		provider
	}) : null;
	const finalId = normalizeSessionPeerId({
		channel: provider,
		peerKind: kind,
		peerId: originatingGroupTargetId ? originatingGroupTargetId : headIsSurface ? secondIsKind ? parts.slice(2).join(":") : parts.slice(1).join(":") : from
	});
	if (!finalId) return null;
	return {
		key: `${provider}:${kind}:${finalId}`,
		channel: provider,
		id: finalId,
		chatType: kind === "channel" ? "channel" : "group"
	};
}
//#endregion
//#region src/config/sessions/metadata.ts
const mergeOrigin = (existing, next) => {
	if (!existing && !next) return;
	const merged = existing ? { ...existing } : {};
	if (next?.label) merged.label = next.label;
	if (next?.provider) merged.provider = next.provider;
	if (next?.surface) merged.surface = next.surface;
	if (next?.chatType) merged.chatType = next.chatType;
	if (next?.from) merged.from = next.from;
	if (next?.to) merged.to = next.to;
	if (next?.nativeChannelId) merged.nativeChannelId = next.nativeChannelId;
	if (next?.nativeDirectUserId) merged.nativeDirectUserId = next.nativeDirectUserId;
	if (next?.accountId) merged.accountId = next.accountId;
	if (next?.threadId != null && next.threadId !== "") merged.threadId = next.threadId;
	return Object.keys(merged).length > 0 ? merged : void 0;
};
/** Derives session origin metadata from an inbound message context. */
function deriveSessionOrigin(ctx, opts) {
	const isSystemEventProvider = ctx.Provider === "heartbeat" || ctx.Provider === "cron-event" || ctx.Provider === "exec-event";
	if (opts?.skipSystemEventOrigin && isSystemEventProvider) return;
	const label = normalizeOptionalString(resolveConversationLabel(ctx));
	const provider = normalizeMessageChannel(typeof ctx.OriginatingChannel === "string" && ctx.OriginatingChannel || ctx.Surface || ctx.Provider);
	const surface = normalizeOptionalLowercaseString(ctx.Surface);
	const chatType = normalizeChatType(ctx.ChatType) ?? void 0;
	const from = normalizeOptionalString(ctx.From);
	const to = normalizeOptionalString(typeof ctx.OriginatingTo === "string" ? ctx.OriginatingTo : ctx.To);
	const nativeChannelId = normalizeOptionalString(ctx.NativeChannelId);
	const nativeDirectUserId = normalizeOptionalString(ctx.NativeDirectUserId);
	const accountId = normalizeOptionalString(ctx.AccountId);
	const threadId = ctx.MessageThreadId ?? void 0;
	const origin = {};
	if (label) origin.label = label;
	if (provider) origin.provider = provider;
	if (surface) origin.surface = surface;
	if (chatType) origin.chatType = chatType;
	if (from) origin.from = from;
	if (to) origin.to = to;
	if (nativeChannelId) origin.nativeChannelId = nativeChannelId;
	if (nativeDirectUserId) origin.nativeDirectUserId = nativeDirectUserId;
	if (accountId) origin.accountId = accountId;
	if (threadId != null && threadId !== "") origin.threadId = threadId;
	return Object.keys(origin).length > 0 ? origin : void 0;
}
function snapshotSessionOrigin(entry) {
	if (!entry?.origin) return;
	return { ...entry.origin };
}
function deriveGroupSessionPatch(params) {
	const resolution = params.groupResolution ?? resolveGroupSessionKey(params.ctx);
	if (!resolution?.channel) return null;
	const channel = resolution.channel;
	const subject = params.ctx.GroupSubject?.trim();
	const space = params.ctx.GroupSpace?.trim();
	const explicitChannel = params.ctx.GroupChannel?.trim();
	const subjectLooksChannel = Boolean(subject?.startsWith("#"));
	const normalizedChannel = subjectLooksChannel && resolution.chatType !== "channel" ? normalizeChannelId(channel) : null;
	const isChannelProvider = Boolean(normalizedChannel && getLoadedChannelPlugin(normalizedChannel)?.capabilities.chatTypes.includes("channel"));
	const nextGroupChannel = explicitChannel ?? (subjectLooksChannel && subject && (resolution.chatType === "channel" || isChannelProvider) ? subject : void 0);
	const nextSubject = nextGroupChannel ? void 0 : subject;
	const patch = {
		chatType: resolution.chatType ?? "group",
		channel,
		groupId: resolution.id
	};
	if (nextSubject) patch.subject = nextSubject;
	if (nextGroupChannel) patch.groupChannel = nextGroupChannel;
	if (space) patch.space = space;
	const displayName = buildGroupDisplayName({
		provider: channel,
		subject: nextSubject ?? params.existing?.subject,
		groupChannel: nextGroupChannel ?? params.existing?.groupChannel,
		space: space ?? params.existing?.space,
		id: resolution.id,
		key: params.sessionKey
	});
	if (displayName) patch.displayName = displayName;
	return patch;
}
function deriveSessionMetaPatch(params) {
	const groupPatch = deriveGroupSessionPatch(params);
	const origin = deriveSessionOrigin(params.ctx, { skipSystemEventOrigin: params.skipSystemEventOrigin });
	if (!groupPatch && !origin) return null;
	const patch = groupPatch ? { ...groupPatch } : {};
	const mergedOrigin = mergeOrigin(params.existing?.origin, origin);
	if (mergedOrigin) patch.origin = mergedOrigin;
	return Object.keys(patch).length > 0 ? patch : null;
}
//#endregion
//#region src/config/sessions/store-writer-state.ts
const WRITER_QUEUES = /* @__PURE__ */ new Map();
/** Clears session store writer queues and cache for tests. */
function clearSessionStoreCacheForTest() {
	clearSessionStoreCaches();
	clearStoreWriterQueuesForTest(WRITER_QUEUES, "session store queue cleared for test");
}
//#endregion
//#region src/config/sessions/store-writer.ts
async function runExclusiveSessionStoreWrite(storePath, fn) {
	return await runQueuedStoreWrite({
		queues: WRITER_QUEUES,
		storePath,
		label: "runExclusiveSessionStoreWrite",
		fn
	});
}
//#endregion
//#region src/config/sessions/store.ts
const log = createSubsystemLogger("sessions/store");
let sessionArchiveRuntimePromise = null;
let trajectoryCleanupRuntimePromise = null;
const writerStoreFileStats = /* @__PURE__ */ new WeakMap();
function loadSessionArchiveRuntime() {
	sessionArchiveRuntimePromise ??= import("./session-archive.runtime.js");
	return sessionArchiveRuntimePromise;
}
function loadTrajectoryCleanupRuntime() {
	trajectoryCleanupRuntimePromise ??= import("./cleanup-PkUNEe4x.js");
	return trajectoryCleanupRuntimePromise;
}
function removeThreadFromDeliveryContext(context) {
	if (!context || context.threadId == null) return context;
	const next = { ...context };
	delete next.threadId;
	return next;
}
function readSessionUpdatedAt(params) {
	try {
		return readSessionEntry(params.storePath, params.sessionKey, { hydrateSkillPromptRefs: false })?.updatedAt;
	} catch {
		return;
	}
}
function cloneSessionEntry(entry) {
	return cloneSessionStoreRecord({ entry }).entry;
}
function resolveSessionWorkflowStorePath(options) {
	if (options.storePath) return options.storePath;
	const agentId = options.agentId ?? resolveAgentIdFromSessionKey(options.sessionKey);
	return resolveStorePath(getRuntimeConfig().session?.store, {
		agentId,
		env: options.env
	});
}
function getSessionEntry(options) {
	const entry = readSessionEntry(resolveSessionWorkflowStorePath(options), options.sessionKey, { hydrateSkillPromptRefs: options.hydrateSkillPromptRefs });
	return entry ? cloneSessionEntry(entry) : void 0;
}
function listSessionEntries(options = {}) {
	return readSessionEntries(resolveSessionWorkflowStorePath(options)).map(([sessionKey, entry]) => ({
		sessionKey,
		entry: cloneSessionEntry(entry)
	}));
}
function restoreUnchangedSessionStoreCache(storePath, store) {
	if (!isSessionStoreCacheEnabled()) return;
	const loadedFileStat = writerStoreFileStats.get(store) ?? null;
	const currentFileStat = getSessionStoreFreshnessSnapshot(storePath) ?? null;
	if (loadedFileStat?.mtimeMs !== currentFileStat?.mtimeMs || loadedFileStat?.sizeBytes !== currentFileStat?.sizeBytes) {
		invalidateSessionStoreCache(storePath);
		return;
	}
	const serialized = getSerializedSessionStore(storePath);
	const serializedPromptRefs = serialized !== void 0 ? getSerializedSessionStorePromptRefs(storePath) : void 0;
	writeSessionStoreCache({
		storePath,
		store,
		mtimeMs: loadedFileStat?.mtimeMs,
		sizeBytes: loadedFileStat?.sizeBytes,
		serialized,
		serializedPromptRefs,
		takeOwnership: true
	});
	if (serialized !== void 0) setSerializedSessionStore(storePath, serialized, loadedFileStat?.sizeBytes, serializedPromptRefs);
}
function updateSessionStoreWriteCache(params) {
	setSerializedSessionStore(params.storePath, void 0);
	if (!isSessionStoreCacheEnabled()) {
		dropSessionStoreObjectCache(params.storePath);
		dropSessionStoreSnapshotCache(params.storePath);
		return;
	}
	const fileStat = getSessionStoreFreshnessSnapshot(params.storePath);
	writeSessionStoreCache({
		storePath: params.storePath,
		store: params.store,
		mtimeMs: fileStat?.mtimeMs,
		sizeBytes: fileStat?.sizeBytes,
		takeOwnership: params.takeOwnership
	});
	dropSessionStoreSnapshotCache(params.storePath);
}
function loadMutableSessionStoreForWriter(storePath) {
	const currentFileStat = getSessionStoreFreshnessSnapshot(storePath);
	if (isSessionStoreCacheEnabled()) {
		const cached = takeMutableSessionStoreCache({
			storePath,
			mtimeMs: currentFileStat?.mtimeMs,
			sizeBytes: currentFileStat?.sizeBytes
		});
		if (cached) {
			writerStoreFileStats.set(cached, currentFileStat ?? null);
			return cached;
		}
	}
	const store = loadSessionStore(storePath, {
		skipCache: true,
		clone: false
	});
	writerStoreFileStats.set(store, currentFileStat ?? null);
	return store;
}
function sessionEntriesHaveSameSerializedForm(previous, next) {
	return previous !== void 0 && JSON.stringify(previous) === JSON.stringify(next);
}
async function saveSessionStoreUnlocked(storePath, store, opts) {
	normalizeSessionStore(store);
	let maintenanceChangedStore = false;
	if (!opts?.skipMaintenance) {
		const maintenance = opts?.maintenanceConfig ? {
			...opts.maintenanceConfig,
			...opts?.maintenanceOverride
		} : {
			...resolveMaintenanceConfig(),
			...opts?.maintenanceOverride
		};
		const shouldWarnOnly = maintenance.mode === "warn";
		const beforeCount = Object.keys(store).length;
		const forceMaintenance = opts?.maintenanceOverride !== void 0;
		const shouldRunEntryMaintenance = shouldRunSessionEntryMaintenance({
			entryCount: beforeCount,
			maxEntries: maintenance.maxEntries,
			force: forceMaintenance
		});
		if (shouldWarnOnly) {
			const activeSessionKey = opts?.activeSessionKey?.trim();
			if (activeSessionKey && shouldRunEntryMaintenance) {
				const warning = getActiveSessionMaintenanceWarning({
					store,
					activeSessionKey,
					pruneAfterMs: maintenance.pruneAfterMs,
					maxEntries: maintenance.maxEntries
				});
				if (warning) {
					log.warn("session maintenance would evict active session; skipping enforcement", {
						activeSessionKey: warning.activeSessionKey,
						wouldPrune: warning.wouldPrune,
						wouldCap: warning.wouldCap,
						pruneAfterMs: warning.pruneAfterMs,
						maxEntries: warning.maxEntries
					});
					await opts?.onWarn?.(warning);
				}
			}
			const diskBudget = await enforceSessionDiskBudget({
				store,
				storePath,
				activeSessionKey: opts?.activeSessionKey,
				maintenance,
				warnOnly: true,
				log
			});
			await opts?.onMaintenanceApplied?.({
				mode: maintenance.mode,
				beforeCount,
				afterCount: Object.keys(store).length,
				pruned: 0,
				capped: 0,
				diskBudget
			});
		} else {
			const preserveSessionKeys = collectSessionMaintenancePreserveKeys([opts?.activeSessionKey]);
			const removedSessionFiles = /* @__PURE__ */ new Map();
			const pruned = pruneStaleEntries(store, maintenance.pruneAfterMs, {
				onPruned: ({ entry }) => {
					rememberRemovedSessionFile(removedSessionFiles, entry);
				},
				preserveKeys: preserveSessionKeys
			});
			const countAfterPrune = Object.keys(store).length;
			const capped = forceMaintenance || shouldRunSessionEntryMaintenance({
				entryCount: countAfterPrune,
				maxEntries: maintenance.maxEntries
			}) ? capEntryCount(store, maintenance.maxEntries, {
				onCapped: ({ entry }) => {
					rememberRemovedSessionFile(removedSessionFiles, entry);
				},
				preserveKeys: preserveSessionKeys
			}) : 0;
			const archivedDirs = /* @__PURE__ */ new Set();
			const referencedSessionIds = new Set(Object.values(store).map((entry) => entry?.sessionId).filter((id) => Boolean(id)));
			const archivedForDeletedSessions = await archiveRemovedSessionTranscripts({
				removedSessionFiles,
				referencedSessionIds,
				storePath,
				reason: "deleted",
				restrictToStoreDir: true
			});
			if (removedSessionFiles.size > 0) {
				const { removeRemovedSessionTrajectoryArtifacts } = await loadTrajectoryCleanupRuntime();
				await removeRemovedSessionTrajectoryArtifacts({
					removedSessionFiles,
					referencedSessionIds,
					storePath,
					restrictToStoreDir: true
				});
			}
			for (const archivedDir of archivedForDeletedSessions) archivedDirs.add(archivedDir);
			if (archivedDirs.size > 0 || maintenance.resetArchiveRetentionMs != null) {
				const { cleanupArchivedSessionTranscripts } = await loadSessionArchiveRuntime();
				const targetDirs = archivedDirs.size > 0 ? [...archivedDirs] : [path.dirname(path.resolve(storePath))];
				await cleanupArchivedSessionTranscripts({
					directories: targetDirs,
					olderThanMs: maintenance.pruneAfterMs,
					reason: "deleted"
				});
				if (maintenance.resetArchiveRetentionMs != null) await cleanupArchivedSessionTranscripts({
					directories: targetDirs,
					olderThanMs: maintenance.resetArchiveRetentionMs,
					reason: "reset"
				});
			}
			const diskBudget = await enforceSessionDiskBudget({
				store,
				storePath,
				activeSessionKey: opts?.activeSessionKey,
				preserveKeys: preserveSessionKeys,
				maintenance,
				warnOnly: false,
				log
			});
			maintenanceChangedStore = pruned > 0 || capped > 0 || (diskBudget?.removedEntries ?? 0) > 0;
			await opts?.onMaintenanceApplied?.({
				mode: maintenance.mode,
				beforeCount,
				afterCount: Object.keys(store).length,
				pruned,
				capped,
				diskBudget
			});
		}
	}
	if (opts?.skipSerializeForUnchangedStore && !maintenanceChangedStore) {
		restoreUnchangedSessionStoreCache(storePath, store);
		return;
	}
	replaceSqliteSessionStore(storePath, store, { compact: maintenanceChangedStore });
	updateSessionStoreWriteCache({
		storePath,
		store,
		takeOwnership: opts?.takeCacheOwnership
	});
}
async function saveSessionStore(storePath, store, opts) {
	await runExclusiveSessionStoreWrite(storePath, async () => {
		await saveSessionStoreUnlocked(storePath, store, opts);
	});
}
async function updateSessionStore(storePath, mutator, opts) {
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const result = await mutator(store);
		if (opts?.skipSaveWhenResult?.(result)) {
			restoreUnchangedSessionStoreCache(storePath, store);
			return result;
		}
		await saveSessionStoreUnlocked(storePath, store, {
			...opts,
			singleEntryPersistence: opts?.resolveSingleEntryPersistence?.(result) ?? void 0
		});
		return result;
	});
}
async function runQuotaSuspensionMaintenance(params) {
	return await updateSessionStore(params.storePath, (store) => pruneQuotaSuspensions({
		store,
		now: params.now ?? Date.now(),
		ttlMs: params.ttlMs,
		log: params.log
	}), { skipMaintenance: true });
}
function rememberRemovedSessionFile(removedSessionFiles, entry) {
	if (!removedSessionFiles.has(entry.sessionId) || entry.sessionFile) removedSessionFiles.set(entry.sessionId, entry.sessionFile);
}
async function archiveRemovedSessionTranscripts(params) {
	const { archiveSessionTranscripts } = await loadSessionArchiveRuntime();
	const archivedDirs = /* @__PURE__ */ new Set();
	for (const [sessionId, sessionFile] of params.removedSessionFiles) {
		if (params.referencedSessionIds.has(sessionId)) continue;
		const archived = archiveSessionTranscripts({
			sessionId,
			storePath: params.storePath,
			sessionFile,
			reason: params.reason,
			restrictToStoreDir: params.restrictToStoreDir
		});
		for (const archivedPath of archived) archivedDirs.add(path.dirname(archivedPath));
	}
	return archivedDirs;
}
async function persistResolvedSessionEntry(params) {
	const entryUnchanged = params.resolved.legacyKeys.length === 0 && sessionEntriesHaveSameSerializedForm(params.resolved.existing, params.next);
	const next = params.takeCacheOwnership ? cloneSessionEntry(params.next) : params.next;
	params.store[params.resolved.normalizedKey] = next;
	for (const legacyKey of params.resolved.legacyKeys) delete params.store[legacyKey];
	await saveSessionStoreUnlocked(params.storePath, params.store, {
		activeSessionKey: params.resolved.normalizedKey,
		skipMaintenance: params.skipMaintenance,
		skipSerializeForUnchangedStore: entryUnchanged,
		singleEntryPersistence: params.resolved.legacyKeys.length === 0 && params.resolved.existing ? {
			sessionKey: params.resolved.normalizedKey,
			entry: next
		} : void 0,
		takeCacheOwnership: params.takeCacheOwnership
	});
	return entryUnchanged || params.returnDetached ? cloneSessionEntry(next) : next;
}
async function updateSessionStoreEntry(params) {
	const { storePath, sessionKey, update } = params;
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const resolved = resolveSessionStoreEntry({
			store,
			sessionKey
		});
		const existing = resolved.existing;
		if (!existing) return null;
		const patch = await update(cloneSessionEntry(existing));
		if (!patch) return existing;
		return await persistResolvedSessionEntry({
			storePath,
			store,
			resolved,
			next: mergeSessionEntry(existing, patch),
			skipMaintenance: params.skipMaintenance,
			takeCacheOwnership: params.takeCacheOwnership ?? true,
			returnDetached: params.takeCacheOwnership !== true
		});
	});
}
async function applySessionStoreEntryPatch(params) {
	const { storePath, sessionKey, patch } = params;
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const resolved = resolveSessionStoreEntry({
			store,
			sessionKey
		});
		const existing = resolved.existing;
		if (!existing) return null;
		return await persistResolvedSessionEntry({
			storePath,
			store,
			resolved,
			next: mergeSessionEntry(existing, patch),
			skipMaintenance: params.skipMaintenance,
			takeCacheOwnership: params.takeCacheOwnership ?? true,
			returnDetached: params.takeCacheOwnership !== true
		});
	});
}
async function patchSessionEntry(params) {
	const storePath = resolveSessionWorkflowStorePath(params);
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const resolved = resolveSessionStoreEntry({
			store,
			sessionKey: params.sessionKey
		});
		const existing = resolved.existing ?? params.fallbackEntry;
		if (!existing) return null;
		const patch = await params.update(cloneSessionEntry(existing));
		if (!patch) return existing;
		return await persistResolvedSessionEntry({
			storePath,
			store,
			resolved,
			next: params.replaceEntry ? cloneSessionEntry(patch) : params.preserveActivity ? mergeSessionEntryPreserveActivity(existing, patch) : mergeSessionEntry(existing, patch),
			takeCacheOwnership: true,
			returnDetached: true
		});
	});
}
async function upsertSessionEntry(params) {
	const storePath = resolveSessionWorkflowStorePath(params);
	await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		await persistResolvedSessionEntry({
			storePath,
			store,
			resolved: resolveSessionStoreEntry({
				store,
				sessionKey: params.sessionKey
			}),
			next: cloneSessionEntry(params.entry),
			takeCacheOwnership: true
		});
	});
}
async function recordSessionMetaFromInbound(params) {
	const { storePath, sessionKey, ctx } = params;
	const createIfMissing = params.createIfMissing ?? true;
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const resolved = resolveSessionStoreEntry({
			store,
			sessionKey
		});
		const existing = resolved.existing;
		const patch = deriveSessionMetaPatch({
			ctx,
			sessionKey: resolved.normalizedKey,
			existing,
			groupResolution: params.groupResolution
		});
		if (!patch) {
			if (existing && resolved.legacyKeys.length > 0) return await persistResolvedSessionEntry({
				storePath,
				store,
				resolved,
				next: existing,
				takeCacheOwnership: true,
				returnDetached: true
			});
			await saveSessionStoreUnlocked(storePath, store, {
				activeSessionKey: resolved.normalizedKey,
				skipSerializeForUnchangedStore: true
			});
			return existing ? cloneSessionEntry(existing) : null;
		}
		if (!existing && !createIfMissing) {
			await saveSessionStoreUnlocked(storePath, store, {
				activeSessionKey: resolved.normalizedKey,
				skipSerializeForUnchangedStore: true
			});
			return null;
		}
		return await persistResolvedSessionEntry({
			storePath,
			store,
			resolved,
			next: existing ? mergeSessionEntryPreserveActivity(existing, patch) : mergeSessionEntry(existing, patch),
			takeCacheOwnership: true,
			returnDetached: true
		});
	});
}
async function updateLastRoute(params) {
	const { storePath, sessionKey, channel, to, accountId, threadId, ctx } = params;
	const createIfMissing = params.createIfMissing ?? true;
	return await runExclusiveSessionStoreWrite(storePath, async () => {
		const store = loadMutableSessionStoreForWriter(storePath);
		const resolved = resolveSessionStoreEntry({
			store,
			sessionKey
		});
		const existing = resolved.existing;
		if (!existing && !createIfMissing) return null;
		const explicitContext = normalizeDeliveryContext(params.deliveryContext);
		const inlineContext = normalizeDeliveryContext({
			channel,
			to,
			accountId,
			threadId
		});
		const routeContext = deliveryContextFromChannelRoute(params.route);
		const mergedInput = mergeDeliveryContext(routeContext, mergeDeliveryContext(explicitContext, inlineContext));
		const explicitDeliveryContext = params.deliveryContext;
		const explicitThreadValue = (explicitDeliveryContext != null && Object.hasOwn(explicitDeliveryContext, "threadId") ? explicitDeliveryContext.threadId : void 0) ?? (threadId != null && threadId !== "" ? threadId : void 0);
		const merged = mergeDeliveryContext(mergedInput, Boolean(routeContext?.channel || routeContext?.to || explicitContext?.channel || explicitContext?.to || inlineContext?.channel || inlineContext?.to) && explicitThreadValue == null ? removeThreadFromDeliveryContext(deliveryContextFromSession(existing)) : deliveryContextFromSession(existing));
		const normalized = normalizeSessionDeliveryFields({
			route: params.route,
			deliveryContext: {
				channel: merged?.channel,
				to: merged?.to,
				accountId: merged?.accountId,
				threadId: merged?.threadId
			}
		});
		const metaPatch = ctx ? deriveSessionMetaPatch({
			ctx,
			sessionKey: resolved.normalizedKey,
			existing,
			groupResolution: params.groupResolution
		}) : null;
		const basePatch = {
			route: normalized.route,
			deliveryContext: normalized.deliveryContext,
			lastChannel: normalized.lastChannel,
			lastTo: normalized.lastTo,
			lastAccountId: normalized.lastAccountId,
			lastThreadId: normalized.lastThreadId
		};
		return await persistResolvedSessionEntry({
			storePath,
			store,
			resolved,
			next: mergeSessionEntryPreserveActivity(existing, metaPatch ? {
				...basePatch,
				...metaPatch
			} : basePatch),
			takeCacheOwnership: true,
			returnDetached: true
		});
	});
}
//#endregion
export { resolveSessionArtifactCanonicalPathsForEntry as C, pruneUnreferencedSessionArtifacts as S, deriveSessionOrigin as _, patchSessionEntry as a, resolveGroupSessionKey as b, runQuotaSuspensionMaintenance as c, updateSessionStore as d, updateSessionStoreEntry as f, deriveSessionMetaPatch as g, deriveGroupSessionPatch as h, listSessionEntries as i, saveSessionStore as l, clearSessionStoreCacheForTest as m, archiveRemovedSessionTranscripts as n, readSessionUpdatedAt as o, upsertSessionEntry as p, getSessionEntry as r, recordSessionMetaFromInbound as s, applySessionStoreEntryPatch as t, updateLastRoute as u, snapshotSessionOrigin as v, enforceSessionDiskBudget as x, buildGroupDisplayName as y };
