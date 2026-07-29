import "./undici-runtime-CdQVyjAR.js";
import "./ssrf-CvPEXMGn.js";
import "./node-proxy-agent-CWnkEd0Y.js";
import "./proxy-fetch-pQvcG8AH.js";
import "./fetch-Nbk9-8FW.js";
//#region src/plugin-sdk/fetch-runtime.ts
/** Apply the trusted-env-proxy guarded fetch preset without exposing raw mode strings to plugins. */
function withTrustedEnvProxyGuardedFetchMode(params) {
	return {
		...params,
		mode: "trusted_env_proxy"
	};
}
//#endregion
export { withTrustedEnvProxyGuardedFetchMode as t };
