import { normalizeAgentId } from "openclaw/plugin-sdk/routing";
import type { HaUserIdentity } from "./protocol.js";

/**
 * Map an HA user to the agent whose memory their chat uses. Admin (owner) → "main"
 * (unified cross-channel assistant); everyone else → "home-<normalized hass user id>"
 * so each person gets an isolated, auto-provisioned memory store.
 */
export function resolveHaAgentId(user: HaUserIdentity): string {
  if (user.is_admin) {
    return "main";
  }
  return `home-${normalizeAgentId(user.user_id || "anonymous")}`;
}
