import { i as OpenClawConfig } from "../types.openclaw-20mzwaMw.js";
import { d as SecretInput } from "../types.secrets-rAcqRhcN.js";
import { _ as upsertAuthProfileWithLock, g as upsertAuthProfile } from "../auth-profiles-CcqNmT5U.js";
import { a as normalizeSecretInputModeInput, c as promptSecretRefForSetup, i as normalizeApiKeyInput, n as ensureApiKeyFromOptionEnvOrPrompt, o as validateApiKeyInput, r as formatApiKeyPreview, s as resolveSecretInputModeForEnvSelection } from "../provider-auth-input-SP6_6zvF.js";
import { a as upsertApiKeyProfile, i as buildApiKeyCredential, r as applyAuthProfileConfig, t as ApiKeyStorageOptions } from "../provider-auth-helpers-W7KH_y2c.js";
import { t as createProviderApiKeyAuthMethod } from "../provider-api-key-auth-SM8SzeV8.js";
import { n as normalizeSecretInput, t as normalizeOptionalSecretInput } from "../normalize-secret-input-DuM-MDGm.js";
export { type ApiKeyStorageOptions, type OpenClawConfig, type SecretInput, applyAuthProfileConfig, buildApiKeyCredential, createProviderApiKeyAuthMethod, ensureApiKeyFromOptionEnvOrPrompt, formatApiKeyPreview, normalizeApiKeyInput, normalizeOptionalSecretInput, normalizeSecretInput, normalizeSecretInputModeInput, promptSecretRefForSetup, resolveSecretInputModeForEnvSelection, upsertApiKeyProfile, upsertAuthProfile, upsertAuthProfileWithLock, validateApiKeyInput };