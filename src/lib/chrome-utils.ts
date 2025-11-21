import { CSS_VARIABLES } from "@/constants/config";
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
	const [storedPreset, currentValues] = await Promise.all([
		Storage.getPreset(currentTheme),
		SendMessage.getVars(currentTabId),
	]);

	return CSS_VARIABLES.reduce<Record<string, string>>(
		(acc, { propertyName }) => {
			acc[propertyName] =
				storedPreset?.[propertyName] || currentValues[propertyName];

			return acc;
		},
		{},
	);
};

export const ChromeUtils = {
	getActiveTab,
	getPickerValues,
};
