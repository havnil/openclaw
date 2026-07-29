import { randomUUID } from "node:crypto";
import { readFile, writeFile, readdir, mkdir, rm, rename } from "node:fs/promises";
import { join } from "node:path";
import type { StoredMessage, ConversationSummary } from "./protocol.js";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: StoredMessage[];
}

export class ConversationStore {
  // Per-conversation write-lock chain: prevents concurrent read-modify-write
  // calls from clobbering each other (or producing concatenated-garbage files
  // when two writes truncate-and-write the same path in overlap).
  private readonly writeLocks = new Map<string, Promise<unknown>>();

  constructor(private readonly baseDir: string) {}

  private userDir(userId: string): string {
    return join(this.baseDir, userId);
  }

  private convPath(userId: string, convId: string): string {
    return join(this.userDir(userId), `${convId}.json`);
  }

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.writeLocks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn); // run regardless of prior outcome
    this.writeLocks.set(key, next);
    try {
      return await next;
    } finally {
      if (this.writeLocks.get(key) === next) {
        this.writeLocks.delete(key);
      }
    }
  }

  // Atomic write: temp-file + rename. POSIX rename within the same filesystem
  // is atomic, so readers always see the old file or the new one — never a
  // half-written byte stream.
  private async atomicWrite(path: string, data: string): Promise<void> {
    const tmp = `${path}.tmp.${randomUUID()}`;
    await writeFile(tmp, data);
    await rename(tmp, path);
  }

  async create(userId: string): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const conv: Conversation = {
      id,
      user_id: userId,
      title: "New conversation",
      created_at: now,
      updated_at: now,
      messages: [],
    };
    await mkdir(this.userDir(userId), { recursive: true });
    await this.atomicWrite(this.convPath(userId, id), JSON.stringify(conv, null, 2));
    return conv;
  }

  async list(userId: string): Promise<ConversationSummary[]> {
    const dir = this.userDir(userId);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return [];
    }
    const convs: ConversationSummary[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }
      try {
        const raw = await readFile(join(dir, file), "utf-8");
        const conv: Conversation = JSON.parse(raw);
        convs.push({
          id: conv.id,
          title: conv.title,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        });
      } catch {
        // skip corrupt files
      }
    }
    convs.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return convs;
  }

  async load(convId: string, userId: string): Promise<Conversation | null> {
    try {
      const raw = await readFile(this.convPath(userId, convId), "utf-8");
      const conv: Conversation = JSON.parse(raw);
      if (conv.user_id !== userId) {
        return null;
      }
      return conv;
    } catch {
      return null;
    }
  }

  async appendMessage(convId: string, userId: string, message: StoredMessage): Promise<void> {
    await this.withLock(`${userId}/${convId}`, async () => {
      const conv = await this.load(convId, userId);
      if (!conv) {
        return;
      }
      conv.messages.push(message);
      conv.updated_at = new Date().toISOString();
      await this.atomicWrite(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
    });
  }

  async delete(convId: string, userId: string): Promise<void> {
    await this.withLock(`${userId}/${convId}`, async () => {
      const conv = await this.load(convId, userId);
      if (!conv) {
        return;
      }
      try {
        await rm(this.convPath(userId, convId));
      } catch {
        // already gone
      }
    });
  }

  async rename(convId: string, userId: string, title: string): Promise<void> {
    await this.withLock(`${userId}/${convId}`, async () => {
      const conv = await this.load(convId, userId);
      if (!conv) {
        return;
      }
      conv.title = title;
      conv.updated_at = new Date().toISOString();
      await this.atomicWrite(this.convPath(userId, convId), JSON.stringify(conv, null, 2));
    });
  }
}
