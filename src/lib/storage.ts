import { logger } from "@/lib/logger";
import type { StorageData, ThemePresets } from "@/types";

/**
 * Gets all theme presets from storage
 */
const getAllPresets = async (): Promise<ThemePresets> => {
	try {
		const result = await chrome.storage.sync.get<StorageData>("theme_presets");
		return result.theme_presets ?? {};
	} catch (err) {
		logger.error("Storage read error:", err);
		return {};
	}
};

/**
 * Gets preset for a specific theme
 */
const getPreset = async (
	themeName: string,
): Promise<ThemePresets[string] | undefined> => {
	const presets = await getAllPresets();

	return presets[themeName];
};

/**
 * Saves a single CSS variable for a theme
 */
const savePresetVar = async (
	themeName: string,
	varName: string,
	value: string,
) => {
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
};

/**
 * Deletes all overrides for a specific theme
 */
const deletePreset = async (themeName: string) => {
	const presets = await getAllPresets();

	if (presets[themeName]) {
		delete presets[themeName];
		try {
			await chrome.storage.sync.set({ theme_presets: presets });
		} catch (err) {
			logger.error("Storage delete error:", err);
			throw err;
		}
	}
};

export const Storage = {
	getPreset,
	savePresetVar,
	deletePreset,
};
