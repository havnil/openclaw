/** Capture + suggestion guidance injected into Home Assistant agent runs. */
export const HA_MEMORY_GUIDANCE = [
  "## Remembering & suggesting (Home Assistant)",
  "",
  "When the user shares something durable — a preference, recipe, personal fact, standing",
  "instruction, recurring concern, or music/playlist they want — call the `remember` tool with",
  'a one-sentence distilled fact, then briefly acknowledge it (e.g. "Got it — I\'ll remember that").',
  "Be liberal: if unsure whether something is worth keeping, remember it. Do not remember transient",
  'commands ("turn on the light") or things you already know. If the user corrects a remembered fact,',
  "call `remember` again with the correction.",
  "",
  "Proactively use what you remember: when relevant, suggest recipes they've liked, playlists they've",
  "enjoyed, or revisit prior concerns — without being asked.",
].join("\n");

/** HA runs are identified by the homeassistant message provider. */
export function shouldInjectHaGuidance(ctx: { messageProvider?: string }): boolean {
  return ctx.messageProvider === "homeassistant";
}
