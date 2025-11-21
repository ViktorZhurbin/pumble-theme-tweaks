/** biome-ignore-all lint/suspicious/noExplicitAny: it's a logger */
const IS_DEV = import.meta.env.DEV;

export const logger = {
	debug(...args: any[]) {
		if (IS_DEV) console.log("[pumble-colors]", ...args);
	},
	info(...args: any[]) {
		console.info("[pumble-colors]", ...args);
	},
	warn(...args: any[]) {
		console.warn("[pumble-colors]", ...args);
	},
	error(...args: any[]) {
		console.error("[pumble-colors]", ...args);
	},
};
