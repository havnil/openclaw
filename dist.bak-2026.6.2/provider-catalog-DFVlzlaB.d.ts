import { m as ModelProviderDeclarationConfig } from "./types.models-BLnM5Oim.js";
//#region extensions/qwen/provider-catalog.d.ts
declare function buildQwenProvider(params?: {
  baseUrl?: string;
}): ModelProviderDeclarationConfig;
declare function buildQwenOAuthProvider(): ModelProviderDeclarationConfig;
declare const buildModelStudioProvider: typeof buildQwenProvider;
//#endregion
export { buildQwenOAuthProvider as n, buildQwenProvider as r, buildModelStudioProvider as t };