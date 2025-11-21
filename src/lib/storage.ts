import type { StorageData, ThemePresets } from "@/types";
import { logger } from "./logger";

/**
 * Gets all theme presets from storage
 */
async function getAllPresets() {
	const result = await chrome.storage.sync.get<StorageData>("theme_presets");

	return result.theme_presets ?? {};
}

/**
 * Gets preset for a specific theme
 */
async function getPreset(
	themeName: string,
): Promise<ThemePresets[string] | undefined> {
	const presets = await getAllPresets();

	return presets[themeName];
}

/**
 * Saves a single CSS variable for a theme
 */
async function savePresetVar(
	themeName: string,
	varName: string,
	value: string,
) {
	const presets = await getAllPresets();

	if (!presets[themeName]) {
		presets[themeName] = {};
	}
	presets[themeName][varName] = value;

	try {
		await chrome.storage.sync.set({ theme_presets: presets });
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
}

/**
 * Deletes all overrides for a specific theme
 */
async function deletePreset(themeName: string) {
	const presets = await getAllPresets();

	if (presets[themeName]) {
		delete presets[themeName];
		await chrome.storage.sync.set({ theme_presets: presets });
	}
}

export const Storage = {
	getPreset,
	savePresetVar,
	deletePreset,
};
