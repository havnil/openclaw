import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { ot as DiscordAccountConfig } from "./types.channels-BwiRzD0c.js";
import { t as DiscordCredentialStatus } from "./token-Bhw2b-jX.js";

//#region extensions/discord/src/account-inspect.d.ts
type InspectedDiscordAccount = {
  accountId: string;
  enabled: boolean;
  name?: string;
  token: string;
  tokenSource: "env" | "config" | "none";
  tokenStatus: DiscordCredentialStatus;
  configured: boolean;
  config: DiscordAccountConfig;
};
declare function inspectDiscordAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  envToken?: string | null;
}): InspectedDiscordAccount;
//#endregion
export { inspectDiscordAccount as n, InspectedDiscordAccount as t };