import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HaDispatchFn } from "./channel.js";

const store = {
  create: vi.fn(),
  appendMessage: vi.fn(),
  load: vi.fn(),
  rename: vi.fn(),
};
let dispatchImpl: HaDispatchFn | null = null;

vi.mock("./channel.js", () => ({
  getConversationStore: () => store,
  getHaDispatch: () => dispatchImpl,
  getHaTranscribe: () => null,
  isAdmin: () => false,
  resolveAccount: () => ({
    accountId: "default",
    url: "",
    token: "tok",
    secret: "s3cret",
    admins: [],
  }),
}));

const { createSendHandler } = await import("./gateway-methods.js");

function run(dispatch: HaDispatchFn) {
  dispatchImpl = dispatch;
  const broadcastToConnIds = vi.fn();
  const respond = vi.fn();
  const handler = createSendHandler(() => ({}));
  return {
    broadcastToConnIds,
    respond,
    call: () =>
      handler({
        params: {
          secret: "s3cret",
          user_id: "u1",
          content: "hi",
          conn_id: "c1",
          conversation_id: "conv-1",
        },
        respond,
        context: { broadcastToConnIds },
      }),
  };
}

describe("createSendHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.create.mockResolvedValue({ id: "conv-1", title: "New conversation" });
    store.appendMessage.mockResolvedValue(undefined);
    store.load.mockResolvedValue({ id: "conv-1", title: "Chat", messages: [] });
    store.rename.mockResolvedValue(undefined);
  });

  it("broadcasts homeassistant.tool_call when dispatch reports tool activity", async () => {
    const { broadcastToConnIds, call } = run(async ({ onToolActivity, onDone }) => {
      onToolActivity?.();
      onDone("done");
    });

    await call();

    const events = broadcastToConnIds.mock.calls.map((c) => c[0]);
    expect(events).toContain("homeassistant.tool_call");
    const toolCall = broadcastToConnIds.mock.calls.find((c) => c[0] === "homeassistant.tool_call");
    expect(toolCall?.[1]).toMatchObject({ conversation_id: "conv-1" });
  });

  it("does not broadcast tool_call when dispatch reports no tool activity", async () => {
    const { broadcastToConnIds, call } = run(async ({ onDone }) => {
      onDone("done");
    });

    await call();

    const events = broadcastToConnIds.mock.calls.map((c) => c[0]);
    expect(events).not.toContain("homeassistant.tool_call");
    expect(events).toContain("homeassistant.done");
  });
});
