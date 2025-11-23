/** biome-ignore-all lint/suspicious/noExplicitAny: it's a logger */
const IS_DEBUG = import.meta.env.DEBUG;

export const logger = {
	debug(...args: any[]) {
		if (IS_DEBUG) console.log("[pumble-colors]", ...args);
	},
	info(...args: any[]) {
		if (IS_DEBUG) console.info("[pumble-colors]", ...args);
	},
	warn(...args: any[]) {
		console.warn("[pumble-colors]", ...args);
	},
	error(...args: any[]) {
		console.error("[pumble-colors]", ...args);
	},
};
