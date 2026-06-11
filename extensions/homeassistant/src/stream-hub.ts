export type HaStreamEvent =
  | { type: "token"; token: string }
  | { type: "tool" }
  | { type: "done"; full_text?: string }
  | { type: "error"; error: string }
  | { type: "title"; title: string };

type Listener = (event: HaStreamEvent) => void;

export class StreamHub {
  private subs = new Map<string, Set<Listener>>();
  subscribe(conversationId: string, listener: Listener): () => void {
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
    const set = this.subs.get(conversationId);
    if (!set) {
      return;
    }
    const snapshot = new Set(set);
    for (const l of snapshot) {
      l(event);
    }
  }
}
