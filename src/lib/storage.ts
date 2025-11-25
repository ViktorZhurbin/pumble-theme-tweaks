import { logger } from "@/lib/logger";
import type {
	StorageData,
	ThemeTweaks,
	ThemeTweaksRecord,
} from "@/types/tweaks";
import { Utils } from "./utils";
import { browser } from "wxt/browser";

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
	tabId?: number,
) => {
	const tweaks = await getAllTweaks();

	tweaks[themeName] ??= { disabled: false, cssProperties: {} };
	tweaks[themeName].cssProperties[propertyName] = value;

	try {
		const dataToSave: StorageData = { theme_tweaks: tweaks };

		if (tabId !== undefined) {
			dataToSave.last_update_tab_id = tabId;
		}

		await browser.storage.sync.set(dataToSave as Record<string, unknown>);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

const savePropertyDebounced = Utils.debounce(
	(theme: string, propertyName: string, value: string, tabId?: number) => {
		Storage.saveProperty(theme, propertyName, value, tabId);
	},
	500,
);

/**
 * Deletes all tweaks for a specific theme
 */
const deleteTweaks = async (themeName: string, tabId?: number) => {
	const tweaks = await getAllTweaks();

	if (tweaks[themeName]) {
		delete tweaks[themeName];
		try {
			const dataToSave: StorageData = { theme_tweaks: tweaks };
			if (tabId !== undefined) {
				dataToSave.last_update_tab_id = tabId;
			}
			await browser.storage.sync.set(dataToSave as Record<string, unknown>);
		} catch (err) {
			logger.error("Storage delete error:", err);
			throw err;
		}
	}
};

/**
 * Sets the disabled state for a specific theme
 */
const setDisabled = async (
	themeName: string,
	disabled: boolean,
	tabId?: number,
) => {
	const tweaks = await getAllTweaks();

	tweaks[themeName] ??= { disabled: false, cssProperties: {} };
	tweaks[themeName].disabled = disabled;

	try {
		const dataToSave: StorageData = { theme_tweaks: tweaks };

		if (tabId !== undefined) {
			dataToSave.last_update_tab_id = tabId;
		}

		await browser.storage.sync.set(dataToSave as Record<string, unknown>);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * Gets the global disabled state
 */
const getGlobalDisabled = async (): Promise<boolean> => {
	try {
		const result = (await browser.storage.sync.get(
			"global_disabled",
		)) as StorageData;
		return result.global_disabled ?? false;
	} catch (err) {
		logger.error("Storage read error:", err);
		return false;
	}
};

/**
 * Sets the global disabled state
 */
const setGlobalDisabled = async (disabled: boolean, tabId?: number) => {
	try {
		const dataToSave: StorageData = { global_disabled: disabled };

		if (tabId !== undefined) {
			dataToSave.last_update_tab_id = tabId;
		}

		await browser.storage.sync.set(dataToSave as Record<string, unknown>);
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
	getGlobalDisabled,
	setGlobalDisabled,
};
