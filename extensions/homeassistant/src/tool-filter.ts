/**
 * Tool name patterns restricted from standard (non-admin) HA users.
 * These cover file system access, shell execution, and system admin tools.
 */
export const RESTRICTED_TOOL_PATTERNS: RegExp[] = [
  /^file_/,
  /^shell_/,
  /^bash$/,
  /^terminal/,
  /^exec/,
  /^system_/,
  /^admin_/,
  /^config_/,
  /^write$/,
  /^edit$/,
  /^delete$/,
];

export function filterToolsForUser<T extends { name: string }>(tools: T[], isAdmin: boolean): T[] {
  if (isAdmin) return tools;
  return tools.filter(
    (tool) => !RESTRICTED_TOOL_PATTERNS.some((pattern) => pattern.test(tool.name)),
  );
}
