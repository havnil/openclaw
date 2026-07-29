import { t as getMatrixScopedEnvVarNames } from "./env-vars-Gd1yKtzb.js";
import { i as resolveScopedMatrixEnvConfig, r as resolveMatrixEnvAuthReadiness, t as hasReadyMatrixEnvAuth } from "./env-auth-B_5QIHM9.js";
import { n as validateMatrixHomeserverUrl, t as resolveValidatedMatrixHomeserverUrl } from "./url-validation-E6GG4wvP.js";
import { t as isBunRuntime } from "./runtime-BefyhPWv.js";
import { i as resolveMatrixConfigForAccount, n as resolveMatrixAuth, r as resolveMatrixAuthContext, t as backfillMatrixAuthDeviceIdAfterStartup } from "./config-D31vgROn.js";
import { t as createMatrixClient } from "./create-client-DOEGDEwn.js";
import { i as resolveSharedMatrixClient, n as releaseSharedClientInstance, o as stopSharedClientForAccount, r as removeSharedClientInstance, s as stopSharedClientInstance, t as acquireSharedMatrixClient } from "./shared-tE2oRwpe.js";
import "./client-BbVd_miU.js";
export { acquireSharedMatrixClient, backfillMatrixAuthDeviceIdAfterStartup, createMatrixClient, getMatrixScopedEnvVarNames, hasReadyMatrixEnvAuth, isBunRuntime, releaseSharedClientInstance, removeSharedClientInstance, resolveMatrixAuth, resolveMatrixAuthContext, resolveMatrixConfigForAccount, resolveMatrixEnvAuthReadiness, resolveScopedMatrixEnvConfig, resolveSharedMatrixClient, resolveValidatedMatrixHomeserverUrl, stopSharedClientForAccount, stopSharedClientInstance, validateMatrixHomeserverUrl };
