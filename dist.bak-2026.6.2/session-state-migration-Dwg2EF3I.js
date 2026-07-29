import { n as autoMigrateLegacyState } from "./state-migrations-Dv3f3gtQ.js";
//#region src/infra/session-state-migration.ts
let sessionStateMigrationPromise = null;
async function ensureSessionStateMigrated(cfg) {
	sessionStateMigrationPromise ??= autoMigrateLegacyState({
		cfg,
		env: process.env
	}).then(() => void 0);
	await sessionStateMigrationPromise;
}
//#endregion
export { ensureSessionStateMigrated as t };
