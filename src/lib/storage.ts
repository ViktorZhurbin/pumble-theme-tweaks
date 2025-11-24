import browser from "webextension-polyfill";
import { logger } from "@/lib/logger";
import type { StorageData, ThemeTweaks, ThemeTweaksRecord } from "@/types";
import { Utils } from "./utils";

/**
 * Gets all theme tweaks from storage
 */
const getAllTweaks = async (): Promise<ThemeTweaksRecord> => {
	try {
		const result = (await browser.storage.sync.get(
			"theme_tweaks",
		)) as StorageData;
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
): Promise<ThemeTweaks | undefined> => {
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
		await browser.storage.sync.set({ theme_tweaks: tweaks });
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

const savePropertyDebounced = Utils.debounce(
	(theme: string, propertyName: string, value: string) => {
		Storage.saveProperty(theme, propertyName, value);
	},
	500,
);

/**
 * Deletes all tweaks for a specific theme
 */
const deleteTweaks = async (themeName: string) => {
	const tweaks = await getAllTweaks();

	if (tweaks[themeName]) {
		delete tweaks[themeName];
		try {
			await browser.storage.sync.set({ theme_tweaks: tweaks });
		} catch (err) {
			logger.error("Storage delete error:", err);
			throw err;
		}
	}
};

/**
 * Sets the disabled state for a specific theme
 */
const setDisabled = async (themeName: string, disabled: boolean) => {
	const tweaks = await getAllTweaks();

	tweaks[themeName] ??= { disabled: false, cssProperties: {} };
	tweaks[themeName].disabled = disabled;

	try {
		await browser.storage.sync.set({ theme_tweaks: tweaks });
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

export const Storage = {
	getTweaks,
	saveProperty,
	savePropertyDebounced,
	deleteTweaks,
	setDisabled,
};
