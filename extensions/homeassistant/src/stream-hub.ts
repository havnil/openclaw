export type HaStreamEvent =
  | { type: "token"; token: string }
  | { type: "tool" }
  | { type: "done"; full_text?: string }
  | { type: "error"; error: string }
  | { type: "title"; title: string };

/** Listener receives the event plus its monotonic sequence id (written as the SSE `id:`). */
type Listener = (event: HaStreamEvent, seq: number) => void;

type Buffered = { event: HaStreamEvent; seq: number; at: number };

// Bounded so a long-lived gateway never accumulates unbounded stream history.
const BUFFER_TTL_MS = 120_000;
const MAX_EVENTS_PER_CONV = 500;
const MAX_CONVERSATIONS = 200;

/**
 * Fan-out hub for per-conversation SSE events with a short replay buffer. The buffer is what
 * makes the panel robust: a late or RECONNECTING subscriber (EventSource reconnects on any
 * network hiccup and resends `Last-Event-ID`) replays the events it missed — including the
 * terminal `done` — instead of hanging on "thinking" forever. Replaying only events newer than
 * the subscriber's last seen id keeps reconnects gap-free and duplicate-free.
 */
export class StreamHub {
  private subs = new Map<string, Set<Listener>>();
  private buffers = new Map<string, Buffered[]>();
  private seq = 0;
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /**
   * Subscribe to a conversation. Buffered events with `seq > lastEventId` (and within the TTL)
   * are replayed to the new listener first, then it receives live events. Pass the SSE
   * `Last-Event-ID` as `lastEventId` on reconnect; omit it for a fresh subscription.
   */
  subscribe(conversationId: string, listener: Listener, lastEventId?: number): () => void {
    const buf = this.buffers.get(conversationId);
    if (buf) {
      const cutoff = this.now() - BUFFER_TTL_MS;
      const after = lastEventId ?? 0;
      for (const b of buf) {
        if (b.at >= cutoff && b.seq > after) {
          listener(b.event, b.seq);
        }
      }
    }
    let set = this.subs.get(conversationId);
    if (!set) {
      set = new Set();
      this.subs.set(conversationId, set);
    }
    set.add(listener);
    return () => {
      const s = this.subs.get(conversationId);
      if (!s) {
        return;
      }
      s.delete(listener);
      if (s.size === 0) {
        this.subs.delete(conversationId);
      }
    };
  }

  publish(conversationId: string, event: HaStreamEvent): void {
    const seq = ++this.seq;
    this.appendBuffer(conversationId, event, seq);
    const set = this.subs.get(conversationId);
    if (!set) {
      return;
    }
    const snapshot = new Set(set);
    for (const l of snapshot) {
      l(event, seq);
    }
  }

  private appendBuffer(conversationId: string, event: HaStreamEvent, seq: number): void {
    const at = this.now();
    let buf = this.buffers.get(conversationId);
    if (!buf) {
      // Evict the oldest conversation (Map preserves insertion order) when over the cap.
      if (this.buffers.size >= MAX_CONVERSATIONS) {
        const oldest = this.buffers.keys().next().value;
        if (oldest !== undefined) {
          this.buffers.delete(oldest);
        }
      }
      buf = [];
      this.buffers.set(conversationId, buf);
    }
    buf.push({ event, seq, at });
    const cutoff = at - BUFFER_TTL_MS;
    while (buf.length > MAX_EVENTS_PER_CONV || (buf.length > 0 && buf[0]!.at < cutoff)) {
      buf.shift();
    }
  }
}
