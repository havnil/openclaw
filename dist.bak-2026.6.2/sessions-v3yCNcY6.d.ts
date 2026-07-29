import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { n as MsgContext } from "./templating-B1JZxu7k.js";
import { a as SessionEntry, n as GroupKeyResolution, o as SessionScope } from "./types-C3udfj3-.js";
import { g as ResolvedSessionMaintenanceConfig } from "./session-key-qV3Ujvjf.js";
//#region src/config/sessions/group.d.ts
/**
 * Resolves channel/group chat context into the persisted group session key.
 *
 * Provider-prefixed ids use channel-owned normalization, while legacy plugin resolvers remain a
 * fallback for older channel surfaces that cannot yet express the generic route shape.
 */
declare function resolveGroupSessionKey(ctx: MsgContext): GroupKeyResolution | null;
//#endregion
//#region src/config/sessions/artifacts.d.ts
/** Returns true for archived session artifacts and legacy store backup names. */
declare function isSessionArchiveArtifactName(fileName: string): boolean;
/** Returns true for transcript files counted in usage, including reset/deleted archives. */
declare function isUsageCountedSessionTranscriptFileName(fileName: string): boolean;
/** Extracts the session id from a usage-counted transcript filename. */
declare function parseUsageCountedSessionIdFromFileName(fileName: string): string | null;
//#endregion
//#region src/config/sessions/main-session.d.ts
/** Canonicalizes main-session aliases to the current scoped session key. */
declare function canonicalizeMainSessionAlias(params: {
  cfg?: {
    session?: {
      scope?: SessionScope;
      mainKey?: string;
    };
  };
  agentId: string;
  sessionKey: string;
}): string;
//#endregion
//#region src/config/sessions/transcript.d.ts
type AssistantTranscriptText = {
  id?: string;
  text: string;
  timestamp?: number;
};
type LatestAssistantTranscriptText = AssistantTranscriptText;
declare function readLatestAssistantTextFromSessionTranscript(sessionFile: string | undefined): Promise<LatestAssistantTranscriptText | undefined>;
//#endregion
//#region src/config/sessions/session-file.d.ts
/** Resolves a transcript file path and persists it into the session store when needed. */
declare function resolveAndPersistSessionFile(params: {
  sessionId: string;
  sessionKey: string;
  sessionStore: Record<string, SessionEntry>;
  storePath: string;
  sessionEntry?: SessionEntry;
  agentId?: string;
  sessionsDir?: string;
  fallbackSessionFile?: string;
  activeSessionKey?: string;
  maintenanceConfig?: ResolvedSessionMaintenanceConfig;
}): Promise<{
  sessionFile: string;
  sessionEntry: SessionEntry;
}>;
//#endregion
//#region src/config/sessions/targets.d.ts
/** One session store path paired with its owning agent id. */
type SessionStoreTarget = {
  agentId: string;
  storePath: string;
};
/** Resolves all configured and discoverable agent session stores synchronously. */
declare function resolveAllAgentSessionStoreTargetsSync(cfg: OpenClawConfig, params?: {
  env?: NodeJS.ProcessEnv;
}): SessionStoreTarget[];
//#endregion
export { canonicalizeMainSessionAlias as a, parseUsageCountedSessionIdFromFileName as c, readLatestAssistantTextFromSessionTranscript as i, resolveGroupSessionKey as l, resolveAllAgentSessionStoreTargetsSync as n, isSessionArchiveArtifactName as o, resolveAndPersistSessionFile as r, isUsageCountedSessionTranscriptFileName as s, SessionStoreTarget as t };