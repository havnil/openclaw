import { n as zalouserSetupAdapter } from "./setup-core-DKtqPNor.js";
import { t as createZalouserPluginBase } from "./shared-C231350-.js";
import { t as zalouserSetupWizard } from "./setup-surface-y_Ez_HKM.js";
//#region extensions/zalouser/src/channel.setup.ts
const zalouserSetupPlugin = { ...createZalouserPluginBase({
	setupWizard: zalouserSetupWizard,
	setup: zalouserSetupAdapter
}) };
//#endregion
export { zalouserSetupPlugin as t };
