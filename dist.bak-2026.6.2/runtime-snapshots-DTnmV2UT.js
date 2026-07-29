import { y as resolveStateDir } from "./paths-mvMm5bYV.js";
import { p as resolveUserPath } from "./utils-CCC-BEJH.js";
import { s as resolveDefaultAgentDir } from "./agent-scope-config-KLbWcRY1.js";
import { a as resolveAuthProfileDatabasePath } from "./sqlite-h-9zNeF3.js";
import path from "node:path";
import { createHash } from "node:crypto";
//#region src/agents/auth-profiles/clone.ts
/** Deep-clones an auth profile store and rejects non-JSON values. */
function cloneAuthProfileStore(store) {
	return JSON.parse(JSON.stringify(store, (_key, value) => {
		if (typeof value === "bigint" || typeof value === "function" || typeof value === "symbol") throw new TypeError(`AuthProfileStore contains non-JSON value: ${typeof value}`);
		return value;
	}));
}
//#endregion
//#region src/agents/auth-profiles/path-constants.ts
/** Canonical JSON auth profile filename retained for direct file compatibility. */
const AUTH_PROFILE_FILENAME = "auth-profiles.json";
/** Canonical JSON auth runtime state filename retained for direct file compatibility. */
const AUTH_STATE_FILENAME = "auth-state.json";
/** Legacy auth filename migrated into the auth profile store. */
const LEGACY_AUTH_FILENAME = "auth.json";
//#endregion
//#region src/agents/auth-profiles/path-resolve.ts
/**
* Auth profile path resolution.
* Centralizes JSON store paths, display paths, legacy store paths, auth-state
* paths, and cross-agent OAuth refresh lock paths.
*/
/** Resolve the persisted auth profile store path for an agent dir. */
function resolveAuthStorePath(agentDir) {
	const resolved = resolveUserPath(agentDir ?? resolveDefaultAgentDir({}));
	return path.join(resolved, AUTH_PROFILE_FILENAME);
}
/** Resolve the legacy auth store path used by migration code. */
function resolveLegacyAuthStorePath(agentDir) {
	const resolved = resolveUserPath(agentDir ?? resolveDefaultAgentDir({}));
	return path.join(resolved, LEGACY_AUTH_FILENAME);
}
/** Resolve the auth-state sidecar path for usage/cooldown metadata. */
function resolveAuthStatePath(agentDir) {
	const resolved = resolveUserPath(agentDir ?? resolveDefaultAgentDir({}));
	return path.join(resolved, AUTH_STATE_FILENAME);
}
/** Resolve the user-facing auth profile database path. */
function resolveAuthStorePathForDisplay(agentDir) {
	const pathname = resolveAuthProfileDatabasePath(agentDir);
	return pathname.startsWith("~") ? pathname : resolveUserPath(pathname);
}
/** Resolve the user-facing auth state database path. */
function resolveAuthStatePathForDisplay(agentDir) {
	const pathname = resolveAuthProfileDatabasePath(agentDir);
	return pathname.startsWith("~") ? pathname : resolveUserPath(pathname);
}
/**
* Resolve the path of the cross-agent, per-profile OAuth refresh coordination
* lock. The filename hashes `provider\0profileId` so it is filesystem-safe
* for arbitrary unicode/control-character inputs and always bounded in
* length. The NUL separator makes it impossible to collide two distinct
* `(provider, profileId)` pairs by string concatenation.
*
* This lock is the serialization point that prevents the `refresh_token_reused`
* storm when N agents share one OAuth profile (see issue #26322): every agent
* that attempts a refresh acquires this same file lock, so only one HTTP
* refresh is in-flight at a time and peers can adopt the resulting fresh
* credentials instead of racing against a single-use refresh token.
*
* The key intentionally includes `provider` so that two profiles that
* happen to share a `profileId` across providers (operator-renamed profile,
* test fixture, etc.) do not needlessly serialize against each other.
*/
function resolveOAuthRefreshLockPath(provider, profileId) {
	const hash = createHash("sha256");
	hash.update(provider, "utf8");
	hash.update("\0", "utf8");
	hash.update(profileId, "utf8");
	const safeId = `sha256-${hash.digest("hex")}`;
	return path.join(resolveStateDir(), "locks", "oauth-refresh", safeId);
}
//#endregion
//#region src/agents/auth-profiles/runtime-snapshots.ts
/**
* Process-local auth profile snapshots used by prepared runtimes and tests.
* Snapshots are cloned at boundaries so callers cannot mutate shared state.
*/
const runtimeAuthStoreSnapshots = /* @__PURE__ */ new Map();
function resolveRuntimeStoreKey(agentDir) {
	return resolveAuthStorePath(agentDir);
}
/** Reads a cloned runtime auth profile store snapshot for an agent dir. */
function getRuntimeAuthProfileStoreSnapshot(agentDir) {
	const store = runtimeAuthStoreSnapshots.get(resolveRuntimeStoreKey(agentDir));
	return store ? cloneAuthProfileStore(store) : void 0;
}
/** Returns true when a runtime snapshot exists for an agent dir. */
function hasRuntimeAuthProfileStoreSnapshot(agentDir) {
	return runtimeAuthStoreSnapshots.has(resolveRuntimeStoreKey(agentDir));
}
/** Returns true when requested or main runtime snapshots contain profiles. */
function hasAnyRuntimeAuthProfileStoreSource(agentDir) {
	const requestedStore = getRuntimeAuthProfileStoreSnapshot(agentDir);
	if (requestedStore && Object.keys(requestedStore.profiles).length > 0) return true;
	if (!agentDir) return false;
	const mainStore = getRuntimeAuthProfileStoreSnapshot();
	return Boolean(mainStore && Object.keys(mainStore.profiles).length > 0);
}
/** Replaces all runtime auth profile snapshots with cloned entries. */
function replaceRuntimeAuthProfileStoreSnapshots(entries) {
	runtimeAuthStoreSnapshots.clear();
	for (const entry of entries) runtimeAuthStoreSnapshots.set(resolveRuntimeStoreKey(entry.agentDir), cloneAuthProfileStore(entry.store));
}
/** Clears all runtime auth profile snapshots. */
function clearRuntimeAuthProfileStoreSnapshots() {
	runtimeAuthStoreSnapshots.clear();
}
/** Stores a cloned runtime auth profile snapshot for an agent dir. */
function setRuntimeAuthProfileStoreSnapshot(store, agentDir) {
	runtimeAuthStoreSnapshots.set(resolveRuntimeStoreKey(agentDir), cloneAuthProfileStore(store));
}
//#endregion
export { replaceRuntimeAuthProfileStoreSnapshots as a, resolveAuthStatePathForDisplay as c, resolveLegacyAuthStorePath as d, resolveOAuthRefreshLockPath as f, cloneAuthProfileStore as g, LEGACY_AUTH_FILENAME as h, hasRuntimeAuthProfileStoreSnapshot as i, resolveAuthStorePath as l, AUTH_STATE_FILENAME as m, getRuntimeAuthProfileStoreSnapshot as n, setRuntimeAuthProfileStoreSnapshot as o, AUTH_PROFILE_FILENAME as p, hasAnyRuntimeAuthProfileStoreSource as r, resolveAuthStatePath as s, clearRuntimeAuthProfileStoreSnapshots as t, resolveAuthStorePathForDisplay as u };
