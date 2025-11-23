import { PROPERTIES, PROPERTY_NAMES } from "@/constants/properties";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";

const getActiveTab = async () => {
	const [tab] = await chrome.tabs.query({
		active: true,
		currentWindow: true,
	});
	return tab || null;
};

const getPickerValues = async (currentTabId: number, themeName: string) => {
	try {
		const [storedTweaks, currentTheme] = await Promise.all([
			Storage.getTweaks(themeName),
			SendMessage.getProperties(currentTabId),
		]);

		return PROPERTY_NAMES.reduce<Record<string, string>>(
			(acc, propertyName) => {
				const value =
					storedTweaks?.cssProperties[propertyName] ||
					currentTheme[propertyName];

				if (value) {
					acc[propertyName] = value;
				}

				return acc;
			},
			{},
		);
	} catch (err) {
		logger.error("Failed to get picker values", { error: err });
		// Return empty values on error
		return PROPERTIES.reduce<Record<string, string>>(
			(acc, { propertyName }) => {
				acc[propertyName] = "";
				return acc;
			},
			{},
		);
	}
};

export const ChromeUtils = {
	getActiveTab,
	getPickerValues,
};
