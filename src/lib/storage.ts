import { logger } from "@/lib/logger";
import type { StorageData, ThemeTweaks } from "@/types";

/**
 * Gets all theme tweaks from storage
 */
const getAllTweaks = async (): Promise<ThemeTweaks> => {
	try {
		const result = await chrome.storage.sync.get<StorageData>("theme_tweaks");
		return result.theme_tweaks ?? {};
	} catch (err) {
		logger.error("Storage read error:", err);
		return {};
	}
};

/**
 * Gets tweaks for a specific theme
 */
const getTweaks = async (
	themeName: string,
): Promise<ThemeTweaks[string] | undefined> => {
	const tweaks = await getAllTweaks();

	return tweaks[themeName];
};

/**
 * Saves a single CSS property for a theme
 */
const saveProperty = async (
	themeName: string,
	propertyName: string,
	value: string,
) => {
	const tweaks = await getAllTweaks();

	tweaks[themeName] ??= { disabled: false, cssProperties: {} };
	tweaks[themeName].cssProperties[propertyName] = value;

	try {
		await chrome.storage.sync.set({ theme_tweaks: tweaks });
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * Deletes all tweaks for a specific theme
 */
const deleteTweaks = async (themeName: string) => {
	const tweaks = await getAllTweaks();

	if (tweaks[themeName]) {
		delete tweaks[themeName];
		try {
			await chrome.storage.sync.set({ theme_tweaks: tweaks });
		} catch (err) {
			logger.error("Storage delete error:", err);
			throw err;
		}
	}
};

/**
 * Gets whether tweaks are disabled for a specific theme
 * Returns false (enabled) if tweaks don't exist
 */
const getDisabled = async (themeName: string): Promise<boolean> => {
	const tweaks = await getTweaks(themeName);
	return tweaks?.disabled ?? false; // Default to enabled (not disabled)
};

/**
 * Sets the disabled state for a specific theme
 */
const setDisabled = async (themeName: string, disabled: boolean) => {
	const tweaks = await getAllTweaks();

	tweaks[themeName] ??= { disabled: false, cssProperties: {} };
	tweaks[themeName].disabled = disabled;

	try {
		await chrome.storage.sync.set({ theme_tweaks: tweaks });
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

export const Storage = {
	getTweaks,
	saveProperty,
	deleteTweaks,
	getDisabled,
	setDisabled,
};
