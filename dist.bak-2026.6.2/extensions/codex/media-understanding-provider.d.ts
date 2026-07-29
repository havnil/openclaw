import { f as MediaUnderstandingProvider } from "../../types-CpMdjXSM.js";
import { n as CodexAppServerClient, r as CodexAppServerStartOptions, t as resolveCodexAppServerAuthProfileIdForAgent } from "../../auth-bridge-BxQLAbrR.js";

//#region extensions/codex/src/app-server/client-factory.d.ts
type AuthProfileOrderConfig = Parameters<typeof resolveCodexAppServerAuthProfileIdForAgent>[0]["config"];
/** Factory signature used by Codex attempt startup to acquire a client. */
type CodexAppServerClientFactory = (startOptions?: CodexAppServerStartOptions, authProfileId?: string, agentDir?: string, config?: AuthProfileOrderConfig, options?: {
  onStartedClient?: (client: CodexAppServerClient) => void;
  abandonSignal?: AbortSignal;
}) => Promise<CodexAppServerClient>;
//#endregion
//#region extensions/codex/media-understanding-provider.d.ts
/** Dependencies and plugin config for Codex media-understanding calls. */
type CodexMediaUnderstandingProviderOptions = {
  pluginConfig?: unknown;
  clientFactory?: CodexAppServerClientFactory;
};
/**
 * Builds the media-understanding provider that delegates image tasks to an
 * isolated Codex app-server session.
 */
declare function buildCodexMediaUnderstandingProvider(options?: CodexMediaUnderstandingProviderOptions): MediaUnderstandingProvider;
//#endregion
export { CodexMediaUnderstandingProviderOptions, buildCodexMediaUnderstandingProvider };