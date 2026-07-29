import { r as stylePromptTitle } from "./prompt-style-BQVvtDcR.js";
import { intro, outro } from "@clack/prompts";
//#region src/flows/doctor-health.ts
const intro$1 = (message) => intro(stylePromptTitle(message) ?? message);
const outro$1 = (message) => outro(stylePromptTitle(message) ?? message);
let configModulePromise;
function loadConfigModule() {
	return configModulePromise ??= import("./config/config.js");
}
/** Runs the full interactive doctor flow against the provided or default runtime. */
async function doctorCommand(runtime, options = {}) {
	const effectiveRuntime = runtime ?? (await import("./runtime-Dc6wmxIA.js")).defaultRuntime;
	if (options.repair === true || options.yes === true || options.generateGatewayToken === true) {
		const { assertConfigWriteAllowedInCurrentMode } = await loadConfigModule();
		assertConfigWriteAllowedInCurrentMode();
	}
	const { createDoctorPrompter } = await import("./doctor-prompter-D0Fi3kvQ.js");
	const { printWizardHeader } = await import("./onboard-helpers-DVm_usLA.js");
	const prompter = createDoctorPrompter({
		runtime: effectiveRuntime,
		options
	});
	printWizardHeader(effectiveRuntime);
	intro$1("OpenClaw doctor");
	const { resolveOpenClawPackageRoot } = await import("./openclaw-root-3LOaKzFM.js");
	const root = await resolveOpenClawPackageRoot({
		moduleUrl: import.meta.url,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	const { maybeOfferUpdateBeforeDoctor } = await import("./doctor-update-DC_Qacvf.js");
	if ((await maybeOfferUpdateBeforeDoctor({
		runtime: effectiveRuntime,
		options,
		root,
		confirm: (p) => prompter.confirm(p),
		outro: outro$1
	})).handled) return;
	const { maybeRepairUiProtocolFreshness } = await import("./doctor-ui-BTCQa0YD.js");
	const { noteSourceInstallIssues } = await import("./doctor-install-BMFJl5Sd.js");
	const { noteStalePluginRuntimeSymlinks } = await import("./plugin-runtime-symlinks-Z-2di6HT.js");
	const { noteStartupOptimizationHints } = await import("./doctor-platform-notes-DM3fNOWz.js");
	await maybeRepairUiProtocolFreshness(effectiveRuntime, prompter);
	noteSourceInstallIssues(root);
	await noteStalePluginRuntimeSymlinks(root);
	noteStartupOptimizationHints();
	const { loadAndMaybeMigrateDoctorConfig } = await import("./doctor-config-flow-CFgM9fby.js");
	const configResult = await loadAndMaybeMigrateDoctorConfig({
		options,
		confirm: (p) => prompter.confirm(p),
		runtime: effectiveRuntime,
		prompter
	});
	const { CONFIG_PATH } = await loadConfigModule();
	const ctx = {
		runtime: effectiveRuntime,
		options,
		prompter,
		configResult,
		cfg: configResult.cfg,
		cfgForPersistence: structuredClone(configResult.cfg),
		sourceConfigValid: configResult.sourceConfigValid ?? true,
		configPath: configResult.path ?? CONFIG_PATH
	};
	const { runDoctorHealthContributions } = await import("./doctor-health-contributions-C49GjazI.js");
	await runDoctorHealthContributions(ctx);
	outro$1("Doctor complete.");
}
//#endregion
export { doctorCommand };
