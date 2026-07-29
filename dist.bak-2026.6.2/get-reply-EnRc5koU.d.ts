import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { n as GetReplyOptions, s as ReplyPayload } from "./types-Tv9oD0ym.js";
import { n as MsgContext } from "./templating-B1JZxu7k.js";

//#region src/auto-reply/reply/get-reply.d.ts
declare function getReplyFromConfig(ctx: MsgContext, opts?: GetReplyOptions, configOverride?: OpenClawConfig): Promise<ReplyPayload | ReplyPayload[] | undefined>;
//#endregion
export { getReplyFromConfig as t };