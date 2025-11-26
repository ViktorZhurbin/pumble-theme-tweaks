import { PUMBLE_URL } from "@/constants/pumble-urls";

export const UrlUtils = {
	isPumbleUrl(url?: string): boolean {
		if (!url) return false;

		return (
			url.includes(PUMBLE_URL.PROD) ||
			url.includes(PUMBLE_URL.STAGE) ||
			url.includes(PUMBLE_URL.DEV)
		);
	},
};
