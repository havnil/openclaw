import { j as resolveTimerTimeoutMs } from "./number-coercion-CJQ8TR--.js";
import { i as formatErrorMessage } from "./errors-BXLRNqRe.js";
import "./error-runtime-AW3TpCjn.js";
import "./number-runtime-DBLVDypr.js";
import { t as collectZalouserSecurityAuditFindings } from "./security-audit-CCOPhPin.js";
import { a as listZaloGroupMembers, b as waitForZaloQrLogin, c as logoutZaloProfile, i as listZaloFriendsMatching, n as getZaloUserInfo, s as listZaloGroupsMatching, y as startZaloQrLogin } from "./zalo-js-DDGo_R-Z.js";
import { a as sendReactionZalouser, i as sendMessageZalouser } from "./send-D376gkCI.js";
//#region extensions/zalouser/src/probe.ts
async function probeZalouser(profile, timeoutMs) {
	try {
		const user = timeoutMs ? await Promise.race([getZaloUserInfo(profile), new Promise((resolve) => {
			setTimeout(() => resolve(null), resolveTimerTimeoutMs(timeoutMs, 1e3, 1e3));
		})]) : await getZaloUserInfo(profile);
		if (!user) return {
			ok: false,
			error: "Not authenticated"
		};
		return {
			ok: true,
			user
		};
	} catch (error) {
		return {
			ok: false,
			error: formatErrorMessage(error)
		};
	}
}
//#endregion
export { collectZalouserSecurityAuditFindings, getZaloUserInfo, listZaloFriendsMatching, listZaloGroupMembers, listZaloGroupsMatching, logoutZaloProfile, probeZalouser, sendMessageZalouser, sendReactionZalouser, startZaloQrLogin, waitForZaloQrLogin };
