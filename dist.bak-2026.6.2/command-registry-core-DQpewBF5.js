import { b as getCoreCliCommandDescriptors, x as getCoreCliCommandNames$1 } from "./argv-CnfL__6a.js";
import { t as resolveCliArgvInvocation } from "./argv-invocation-CxGUjPqA.js";
import { r as shouldRegisterPrimaryCommandOnly } from "./command-registration-policy-B8qU2fMz.js";
import { i as registerCommandGroups, r as registerCommandGroupByName } from "./register-command-groups-DKyoKsjD.js";
import { a as defineImportedCommandGroupSpec, i as buildCommandGroupEntries, o as defineImportedProgramCommandGroupSpecs } from "./register.subclis-core-Bxi4t696.js";
//#region src/cli/program/command-registry-core.ts
function withProgramOnlySpecs(specs) {
	return specs.map((spec) => ({
		commandNames: spec.commandNames,
		register: async ({ program }) => {
			await spec.register(program);
		}
	}));
}
const coreEntrySpecs = [
	...withProgramOnlySpecs(defineImportedProgramCommandGroupSpecs([
		{
			commandNames: ["crestodian"],
			loadModule: () => import("./register.crestodian-BpY3v-Zy.js"),
			exportName: "registerCrestodianCommand"
		},
		{
			commandNames: ["setup"],
			loadModule: () => import("./register.setup-BfYstDAP.js"),
			exportName: "registerSetupCommand"
		},
		{
			commandNames: ["onboard"],
			loadModule: () => import("./register.onboard-CVGSpHlU.js"),
			exportName: "registerOnboardCommand"
		},
		{
			commandNames: ["configure"],
			loadModule: () => import("./register.configure-C4h-hSTf.js"),
			exportName: "registerConfigureCommand"
		},
		{
			commandNames: ["config"],
			loadModule: () => import("./config-cli-k0M1WLe-.js"),
			exportName: "registerConfigCli"
		},
		{
			commandNames: ["backup"],
			loadModule: () => import("./register.backup-D7P5-d8A.js"),
			exportName: "registerBackupCommand"
		},
		{
			commandNames: ["migrate"],
			loadModule: () => import("./register.migrate-C4yujQWM.js"),
			exportName: "registerMigrateCommand"
		},
		{
			commandNames: [
				"doctor",
				"dashboard",
				"reset",
				"uninstall"
			],
			loadModule: () => import("./register.maintenance-BXN_0r1n.js"),
			exportName: "registerMaintenanceCommands"
		}
	])),
	defineImportedCommandGroupSpec(["message"], () => import("./register.message-BEVOEkFP.js"), (mod, { program, ctx }) => {
		mod.registerMessageCommands(program, ctx);
	}),
	...withProgramOnlySpecs(defineImportedProgramCommandGroupSpecs([{
		commandNames: ["mcp"],
		loadModule: () => import("./mcp-cli-3YvZbCOU.js"),
		exportName: "registerMcpCli"
	}, {
		commandNames: ["transcripts"],
		loadModule: () => import("./register.transcripts-DXjE-Lxf.js"),
		exportName: "registerTranscriptsCli"
	}])),
	defineImportedCommandGroupSpec(["agent"], () => import("./register.agent-turn-BMRJE5P6.js"), (mod, { program, ctx }) => {
		mod.registerAgentTurnCommand(program, { agentChannelOptions: ctx.agentChannelOptions });
	}),
	defineImportedCommandGroupSpec(["agents"], () => import("./register.agent-L5ePIiYQ.js"), (mod, { program }) => {
		mod.registerAgentsCommands(program);
	}),
	...withProgramOnlySpecs(defineImportedProgramCommandGroupSpecs([{
		commandNames: [
			"status",
			"health",
			"sessions",
			"commitments",
			"tasks"
		],
		loadModule: () => import("./register.status-health-sessions-CBcm6393.js"),
		exportName: "registerStatusHealthSessionsCommands"
	}]))
];
function resolveCoreCommandGroups(ctx, argv) {
	return buildCommandGroupEntries(getCoreCliCommandDescriptors(), coreEntrySpecs, (register) => async (program) => {
		await register({
			program,
			ctx,
			argv
		});
	});
}
function getCoreCliCommandNames() {
	return getCoreCliCommandNames$1();
}
async function registerCoreCliByName(program, ctx, name, argv = process.argv) {
	return registerCommandGroupByName(program, resolveCoreCommandGroups(ctx, argv), name);
}
function registerCoreCliCommands(program, ctx, argv) {
	const { primary } = resolveCliArgvInvocation(argv);
	registerCommandGroups(program, resolveCoreCommandGroups(ctx, argv), {
		eager: false,
		primary,
		registerPrimaryOnly: Boolean(primary && shouldRegisterPrimaryCommandOnly(argv))
	});
}
//#endregion
export { registerCoreCliByName as n, registerCoreCliCommands as r, getCoreCliCommandNames as t };
