import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { t as LegacyConfigRule } from "./legacy.shared-CFJyEGh7.js";
import { C as ChannelDoctorConfigMutation } from "./types.adapters-BSvUCykB.js";
//#region extensions/mattermost/src/doctor-contract.d.ts
declare const legacyConfigRules: LegacyConfigRule[];
declare const normalizeCompatibilityConfig: (params: {
  cfg: OpenClawConfig;
}) => ChannelDoctorConfigMutation;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };