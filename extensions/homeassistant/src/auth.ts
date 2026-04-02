import type { HaUserIdentity } from "./protocol.js";

export interface HandshakeParams {
  secret: string | undefined;
  user_id: string | undefined;
  user_name: string | undefined;
  configSecret: string;
  admins: string[];
}

export type HandshakeResult = { ok: true; user: HaUserIdentity } | { ok: false; error: string };

export function isAdmin(userId: string, admins: string[]): boolean {
  return admins.includes(userId);
}

export function verifyHandshake(params: HandshakeParams): HandshakeResult {
  const { secret, user_id, user_name, configSecret, admins } = params;

  if (!secret || secret !== configSecret) {
    return { ok: false, error: "Invalid secret" };
  }

  if (!user_id) {
    return { ok: false, error: "Missing user_id" };
  }

  return {
    ok: true,
    user: {
      user_id,
      user_name: user_name ?? user_id,
      is_admin: isAdmin(user_id, admins),
    },
  };
}
