import { i as OpenClawConfig } from "../../types.openclaw-20mzwaMw.js";
import { a as SsrFBlockedError, o as SsrFPolicy, p as isBlockedHostnameOrIp, t as LookupFn } from "../../ssrf-skjEI_i5.js";
import { $n as PluginRuntime } from "../../types-BJ3mu3UU.js";
import { n as RuntimeEnv } from "../../runtime-Bxifh4bY.js";
import { r as ReplyPayload } from "../../reply-payload-wb3lKGla.js";
import { r as createDedupeCache } from "../../dedupe-D3F9WT__.js";
import { a as fetchWithSsrFGuard } from "../../fetch-guard-BKvfwdRa.js";
import { d as ssrfPolicyFromDangerouslyAllowPrivateNetwork, u as ssrfPolicyFromAllowPrivateNetwork } from "../../ssrf-policy-BIIrD-vo.js";
import { t as createLoggerBackedRuntime } from "../../runtime-logger-DNnQ2PUM.js";
import { t as tlonPlugin } from "../../channel-DznH8uwB.js";

//#region extensions/tlon/src/runtime.d.ts
declare const setTlonRuntime: (next: PluginRuntime) => void, getTlonRuntime: () => PluginRuntime;
//#endregion
export { type LookupFn, type OpenClawConfig, type ReplyPayload, type RuntimeEnv, SsrFBlockedError, type SsrFPolicy, createDedupeCache, createLoggerBackedRuntime, fetchWithSsrFGuard, isBlockedHostnameOrIp, setTlonRuntime, ssrfPolicyFromAllowPrivateNetwork, ssrfPolicyFromDangerouslyAllowPrivateNetwork, tlonPlugin };