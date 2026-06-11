import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, it, expect, vi } from "vitest";
import { createHaHttpApi } from "./http-api.js";
import { StreamHub } from "./stream-hub.js";

function mkReq(method: string, url: string, body?: unknown, secret = "s") {
  const req = new IncomingMessage(new Socket());
  req.method = method;
  req.url = url;
  req.headers["x-openclaw-secret"] = secret;
  if (body !== undefined) {
    req.push(JSON.stringify(body));
    req.push(null);
  } else {
    req.push(null);
  }
  return req;
}

function mkRes() {
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  const chunks: string[] = [];
  (res as any).write = (c: string) => {
    chunks.push(c);
    return true;
  };
  (res as any).end = (c?: string) => {
    if (c) {
      chunks.push(c);
    }
    return res;
  };
  return { res, chunks };
}

describe("HA HTTP API", () => {
  const store = {
    create: vi.fn(async () => ({ id: "c1", title: "New conversation" })),
    appendMessage: vi.fn(async () => {}),
    load: vi.fn(async () => ({ id: "c1", title: "New conversation", messages: [] })),
    rename: vi.fn(async () => {}),
    list: vi.fn(async () => []),
    delete: vi.fn(async () => {}),
  };
  const dispatch = vi.fn(async (p: any) => {
    p.onToken("he");
    p.onToken("i");
    p.onDone("hei");
  });
  const transcribeFake = vi.fn(async (_p: any) => ({ text: "hello" }));
  const mk = () =>
    createHaHttpApi({
      hub: new StreamHub(),
      getStore: () => store as any,
      getDispatch: () => dispatch as any,
      getSecret: () => "s",
      getCfg: () => ({}),
      resolveUser: () => ({ user_id: "havnil", user_name: "Havard", is_admin: true }) as any,
      getTranscribe: () => transcribeFake as any,
    });

  it("rejects a wrong secret with 401", async () => {
    const api = mk();
    const { res } = mkRes();
    await api.handle(mkReq("POST", "/api/homeassistant/send", { text: "hei" }, "wrong"), res);
    expect(res.statusCode).toBe(401);
  });

  it("send dispatches and publishes token+done", async () => {
    const api = mk();
    const events: any[] = [];
    api.hub.subscribe("c1", (e) => events.push(e));
    const { res } = mkRes();
    await api.handle(
      mkReq("POST", "/api/homeassistant/send", { conversation_id: "c1", text: "hei" }),
      res,
    );
    await vi.waitFor(() => expect(events.at(-1)).toEqual({ type: "done", full_text: "hei" }));
    expect(events.map((e) => e.type)).toEqual(["token", "token", "done"]);
  });

  it("POST /conversations list returns empty conversations array", async () => {
    store.list.mockResolvedValueOnce([]);
    const api = mk();
    const { res, chunks } = mkRes();
    await api.handle(
      mkReq("POST", "/api/homeassistant/conversations", { action: "list", user_id: "u" }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(chunks.join(""));
    expect(body).toEqual({ conversations: [] });
  });

  it("POST /conversations create returns an id", async () => {
    store.create.mockResolvedValueOnce({ id: "c2", title: "New conversation" });
    const api = mk();
    const { res, chunks } = mkRes();
    await api.handle(
      mkReq("POST", "/api/homeassistant/conversations", { action: "create", user_id: "u" }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(chunks.join(""));
    expect(body).toHaveProperty("id");
  });

  it("publishes a title event when conversation has default title", async () => {
    // store.load returns "New conversation" title by default — triggers auto-title
    const api = mk();
    const events: any[] = [];
    api.hub.subscribe("c1", (e) => events.push(e));
    const { res } = mkRes();
    await api.handle(
      mkReq("POST", "/api/homeassistant/send", { conversation_id: "c1", text: "lights on" }),
      res,
    );
    await vi.waitFor(() => expect(events.find((e) => e.type === "title")).toBeDefined());
    const titleEvent = events.find((e) => e.type === "title");
    expect(titleEvent).toMatchObject({ type: "title", title: "lights on" });
  });

  it("POST /transcribe returns text from transcribe fn", async () => {
    const audio = Buffer.from("fakeaudio").toString("base64");
    const api = mk();
    const { res, chunks } = mkRes();
    await api.handle(
      mkReq("POST", "/api/homeassistant/transcribe", { audio, mime: "audio/wav" }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(chunks.join(""));
    expect(body).toEqual({ text: "hello", retry: false });
  });
});
