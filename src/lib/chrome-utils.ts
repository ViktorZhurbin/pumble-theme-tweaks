import { CSS_VARIABLES } from "@/constants/config";
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

const getPickerValues = async (currentTabId: number, currentTheme: string) => {
	try {
		const [storedPreset, currentValues] = await Promise.all([
			Storage.getPreset(currentTheme),
			SendMessage.getVars(currentTabId),
		]);

		return CSS_VARIABLES.reduce<Record<string, string>>(
			(acc, { propertyName }) => {
				acc[propertyName] =
					storedPreset?.cssProperties[propertyName] ||
					currentValues[propertyName];

				return acc;
			},
			{},
		);
	} catch (err) {
		logger.error("Failed to get picker values", { error: err });
		// Return empty values on error
		return CSS_VARIABLES.reduce<Record<string, string>>(
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
