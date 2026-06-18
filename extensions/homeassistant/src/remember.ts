import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/** Format one appendable memory bullet for memory/YYYY-MM-DD.md. */
export function formatMemoryLine(params: { fact: string; category?: string }): string {
  const fact = params.fact.trim();
  const category = params.category?.trim();
  const tag = category ? ` _(${category})_` : "";
  return `- ${fact}${tag}\n`;
}

/** YYYY-MM-DD in local time (intuitive for a home user; matches the daily-file convention). */
export function localDateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Append a distilled memory line to <workspaceDir>/memory/<dateStamp>.md (append-only,
 * canonical daily filename). memory-core auto-indexes any *.md under memory/. Returns the
 * written line (without trailing newline) so the caller can acknowledge it.
 */
export async function appendMemoryLine(params: {
  workspaceDir: string;
  dateStamp: string;
  fact: string;
  category?: string;
}): Promise<string> {
  const memoryDir = join(params.workspaceDir, "memory");
  await mkdir(memoryDir, { recursive: true });
  const line = formatMemoryLine({ fact: params.fact, category: params.category });
  await appendFile(join(memoryDir, `${params.dateStamp}.md`), line, "utf-8");
  return line.trimEnd();
}
