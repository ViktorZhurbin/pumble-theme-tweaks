import { CSS_VARIABLES } from "@/lib/config";
import { SendMessage } from "@/lib/messaging";
import { getStoredPreset } from "@/lib/storage";

export async function getPickerValues(
	currentTabId: number,
	currentTheme: string,
) {
	const varNames = CSS_VARIABLES.map((v) => v.name);
	const [storedPreset, liveValues] = await Promise.all([
		getStoredPreset(currentTheme),
		SendMessage.readVars(currentTabId, varNames),
	]);

	const values: Record<string, string> = {};

	CSS_VARIABLES.forEach((config) => {
		values[config.name] =
			storedPreset?.[config.name] || liveValues[config.name] || "#000000";
	});

	return values;
}
