import { describe, it, expect } from "vitest";
import { StreamHub, type HaStreamEvent } from "./stream-hub.js";

describe("StreamHub", () => {
  it("delivers published events to subscribers of the same conversation only", () => {
    const hub = new StreamHub();
    const a: HaStreamEvent[] = [];
    const b: HaStreamEvent[] = [];
    const unsubA = hub.subscribe("c1", (e) => a.push(e));
    hub.subscribe("c2", (e) => b.push(e));
    hub.publish("c1", { type: "token", token: "hi" });
    expect(a).toEqual([{ type: "token", token: "hi" }]);
    expect(b).toEqual([]);
    unsubA();
    hub.publish("c1", { type: "done" });
    expect(a).toHaveLength(1); // no delivery after unsubscribe
  });

  it("replays buffered events to a late subscriber (race: reply before subscribe)", () => {
    const hub = new StreamHub();
    hub.publish("c1", { type: "token", token: "Hei" });
    hub.publish("c1", { type: "done", full_text: "Hei" });
    // Subscriber attaches AFTER the reply already completed — must still receive everything.
    const got: HaStreamEvent[] = [];
    hub.subscribe("c1", (e) => got.push(e));
    expect(got).toEqual([
      { type: "token", token: "Hei" },
      { type: "done", full_text: "Hei" },
    ]);
  });

  it("replays only events newer than Last-Event-ID (gap-free, dup-free reconnect)", () => {
    const hub = new StreamHub();
    const seqs: number[] = [];
    // First connection sees the first two events and records their seq ids.
    const unsub = hub.subscribe("c1", (_e, seq) => seqs.push(seq));
    hub.publish("c1", { type: "token", token: "a" });
    hub.publish("c1", { type: "token", token: "b" });
    unsub();
    // While disconnected, more events arrive.
    hub.publish("c1", { type: "token", token: "c" });
    hub.publish("c1", { type: "done", full_text: "abc" });
    // Reconnect with the last id it saw → only the missed events replay (no "a"/"b" again).
    const afterReconnect: HaStreamEvent[] = [];
    hub.subscribe("c1", (e) => afterReconnect.push(e), seqs[1]);
    expect(afterReconnect).toEqual([
      { type: "token", token: "c" },
      { type: "done", full_text: "abc" },
    ]);
  });

  it("expires buffered events past the TTL", () => {
    let t = 1000;
    const hub = new StreamHub(() => t);
    hub.publish("c1", { type: "token", token: "old" });
    t += 200_000; // advance well past the 120s TTL
    const got: HaStreamEvent[] = [];
    hub.subscribe("c1", (e) => got.push(e));
    expect(got).toEqual([]); // stale event is not replayed
  });
});
