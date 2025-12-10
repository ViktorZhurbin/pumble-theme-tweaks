import { PUMBLE_URL } from "@/constants/pumble-urls";

export const UrlUtils = {
	isPumbleUrl(url?: string): boolean {
		if (!url) return false;

		return Object.values(PUMBLE_URL).some((urlPart) => url.includes(urlPart));
	},
};
