import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { $s as GenerateVideoParams, ec as GenerateVideoRuntimeResult } from "./types-BJ3mu3UU.js";
import { t as SubsystemLogger } from "./subsystem-CfQVin8T.js";
import { n as getProviderEnvVars } from "./provider-env-vars-CNa7yLK3.js";
import { s as VideoGenerationProvider } from "./types-CqQsvzja.js";
import { n as listVideoGenerationProviders, t as getVideoGenerationProvider } from "./provider-registry-Dlr3522o.js";

//#region src/video-generation/runtime.d.ts
declare const log: SubsystemLogger;
type VideoGenerationRuntimeDeps = {
  getProvider?: typeof getVideoGenerationProvider;
  listProviders?: typeof listVideoGenerationProviders;
  getProviderEnvVars?: typeof getProviderEnvVars;
  log?: Pick<typeof log, "debug" | "warn">;
};
declare function listRuntimeVideoGenerationProviders(params?: {
  config?: OpenClawConfig;
}, deps?: VideoGenerationRuntimeDeps): VideoGenerationProvider[];
declare function generateVideo(params: GenerateVideoParams, deps?: VideoGenerationRuntimeDeps): Promise<GenerateVideoRuntimeResult>;
//#endregion
export { listRuntimeVideoGenerationProviders as n, generateVideo as t };