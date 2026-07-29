import { i as matrixSetupAdapter, n as matrixOnboardingAdapter, t as createMatrixThreadBindingManager } from "../../thread-bindings-5EsM0QjF.js";
import { r as resetMatrixThreadBindingsForTests } from "../../thread-bindings-shared-d5fQZug_.js";
import { t as setMatrixRuntime } from "../../runtime-ChKOdn2p.js";
import { n as normalizeCompatibilityConfig, t as legacyConfigRules } from "../../doctor-contract-BOpzTEz3.js";
import { n as collectRuntimeConfigAssignments, r as secretTargetRegistryEntries } from "../../secret-contract-DzqL5gpq.js";

//#region extensions/matrix/src/setup-contract.d.ts
declare const singleAccountKeysToMove: ("deviceId" | "replyToMode" | "avatarUrl" | "groups" | "dm" | "responsePrefix" | "actions" | "textChunkLimit" | "allowBots" | "dangerouslyAllowNameMatching" | "chunkMode" | "blockStreaming" | "mediaMaxMb" | "ackReaction" | "ackReactionScope" | "threadBindings" | "reactionNotifications" | "autoJoin" | "initialSyncLimit" | "encryption" | "allowlistOnly" | "threadReplies" | "startupVerification" | "startupVerificationCooldownHours" | "autoJoinAllowlist" | "rooms")[];
declare const namedAccountPromotionKeys: ("password" | "deviceId" | "name" | "avatarUrl" | "initialSyncLimit" | "encryption" | "homeserver" | "userId" | "accessToken" | "deviceName")[];
declare function resolveSingleAccountPromotionTarget(params: {
  channel: Record<string, unknown>;
}): string;
//#endregion
export { collectRuntimeConfigAssignments, createMatrixThreadBindingManager, legacyConfigRules, matrixSetupAdapter, matrixOnboardingAdapter as matrixSetupWizard, namedAccountPromotionKeys, normalizeCompatibilityConfig, resetMatrixThreadBindingsForTests, resolveSingleAccountPromotionTarget, secretTargetRegistryEntries, setMatrixRuntime, singleAccountKeysToMove };