import { CSS_VARIABLES } from "@/lib/config";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";

export async function getPickerValues(
	currentTabId: number,
	currentTheme: string,
) {
	const [storedPreset, currentValues] = await Promise.all([
		Storage.getPreset(currentTheme),
		SendMessage.readVars(currentTabId),
	]);

	const values: Record<string, string> = {};

	CSS_VARIABLES.forEach((config) => {
		values[config.propertyName] =
			storedPreset?.[config.propertyName] || currentValues[config.propertyName];
	});

	return values;
}
