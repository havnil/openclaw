import { describe, it, expect } from "vitest";
import { StreamHub } from "./stream-hub.js";

describe("StreamHub", () => {
  it("delivers published events to subscribers of the same conversation only", () => {
    const hub = new StreamHub();
    const a: unknown[] = [];
    const b: unknown[] = [];
    const unsubA = hub.subscribe("c1", (e) => a.push(e));
    hub.subscribe("c2", (e) => b.push(e));
    hub.publish("c1", { type: "token", token: "hi" });
    expect(a).toEqual([{ type: "token", token: "hi" }]);
    expect(b).toEqual([]);
    unsubA();
    hub.publish("c1", { type: "done" });
    expect(a).toHaveLength(1); // no delivery after unsubscribe
  });
});
