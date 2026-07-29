import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { U as ChannelLegacyStateMigrationPlan } from "../../types.core-CZRuyur5.js";
//#region extensions/telegram/src/state-migrations.d.ts
declare function detectTelegramLegacyStateMigrations(params: {
  cfg: OpenClawConfig;
  env: NodeJS.ProcessEnv;
  stateDir?: string;
}): Promise<ChannelLegacyStateMigrationPlan[]>;
//#endregion
export { detectTelegramLegacyStateMigrations };