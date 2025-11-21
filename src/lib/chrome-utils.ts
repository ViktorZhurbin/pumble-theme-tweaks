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

	const values: Record<string, string> = {};

	CSS_VARIABLES.forEach((config) => {
		values[config.propertyName] =
			storedPreset?.[config.propertyName] || currentValues[config.propertyName];
	});

	return values;
};

export const ChromeUtils = {
	getActiveTab,
	getPickerValues,
};
