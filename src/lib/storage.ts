import { browser } from "wxt/browser";
import { logger } from "@/lib/logger";
import type {
	StorageData,
	StoredThemeTweaks,
	StoredThemeTweaksRecord,
	StoredTweakEntry,
} from "@/types/tweaks";
import { Utils } from "./utils";

/**
 * Gets all theme tweaks from storage
 */
const getAllTweaks = async (): Promise<StoredThemeTweaksRecord> => {
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
 * Migrates old storage format to new format
 * Old: cssProperties[key] = string, separate enabledProperties array
 * New: cssProperties[key] = { value, enabled }
 */

// biome-ignore lint/suspicious/noExplicitAny: no need for explanation :D
const migrateTweaksFormat = (themeTweaks: any): StoredThemeTweaks => {
	// If already in new format, return as-is
	const firstPropValue = Object.values(themeTweaks.cssProperties || {})[0];
	if (
		firstPropValue &&
		typeof firstPropValue === "object" &&
		"value" in firstPropValue
	) {
		return themeTweaks as StoredThemeTweaks;
	}

	// Migrate from old format
	const oldEnabledProps =
		themeTweaks.enabledProperties ||
		Object.keys(themeTweaks.cssProperties || {});

	const newCssProperties: Record<string, StoredTweakEntry> = {};

	for (const [key, value] of Object.entries(themeTweaks.cssProperties || {})) {
		newCssProperties[key] = {
			value: value as string,
			enabled: oldEnabledProps.includes(key),
		};
	}

	return {
		disabled: themeTweaks.disabled ?? false,
		cssProperties: newCssProperties,
	};
};

/**
 * Gets tweaks for a specific theme
 */
const getTweaks = async (
	themeName: string,
): Promise<StoredThemeTweaks | undefined> => {
	const allTweaks = await getAllTweaks();
	const themeTweaks = allTweaks[themeName];

	if (!themeTweaks) return undefined;

	// Migrate if needed
	return migrateTweaksFormat(themeTweaks);
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
	const allTweaks = await getAllTweaks();

	allTweaks[themeName] ??= { disabled: false, cssProperties: {} };

	// New format: store as object with value and enabled
	// Preserve existing enabled state, default to true
	allTweaks[themeName].cssProperties[propertyName] = {
		value,
		enabled: allTweaks[themeName].cssProperties[propertyName]?.enabled ?? true,
	};

	try {
		const dataToSave: StorageData = { theme_tweaks: allTweaks };

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
 * Deletes a single CSS property for a theme
 */
const deleteProperty = async (
	themeName: string,
	propertyName: string,
	tabId?: number,
) => {
	const allTweaks = await getAllTweaks();

	if (!allTweaks[themeName]?.cssProperties[propertyName]) {
		logger.warn(
			"Storage delete property failed. No property found in stored tweaks:",
			{ themeName, propertyName },
		);
		return;
	}

	logger.info("Storage deleting property:", { themeName, propertyName });
	delete allTweaks[themeName].cssProperties[propertyName];

	// If no more properties, remove the theme entry entirely
	if (Object.keys(allTweaks[themeName].cssProperties).length === 0) {
		delete allTweaks[themeName];
	}

	try {
		const dataToSave: StorageData = { theme_tweaks: allTweaks };
		if (tabId !== undefined) {
			dataToSave.last_update_tab_id = tabId;
		}
		await browser.storage.sync.set(dataToSave as Record<string, unknown>);
	} catch (err) {
		logger.error("Storage delete property error:", err);
		throw err;
	}
};

/**
 * Deletes all tweaks for a specific theme
 */
const deleteTweaks = async (themeName: string, tabId?: number) => {
	const allTweaks = await getAllTweaks();

	if (allTweaks[themeName]) {
		delete allTweaks[themeName];
		try {
			const dataToSave: StorageData = { theme_tweaks: allTweaks };
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
	const allTweaks = await getAllTweaks();

	allTweaks[themeName] ??= { disabled: false, cssProperties: {} };
	allTweaks[themeName].disabled = disabled;

	try {
		const dataToSave: StorageData = { theme_tweaks: allTweaks };

		if (tabId !== undefined) {
			dataToSave.last_update_tab_id = tabId;
		}

		await browser.storage.sync.set(dataToSave as Record<string, unknown>);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * Sets whether a specific property is enabled or disabled
 */
const setPropertyEnabled = async (
	themeName: string,
	propertyName: string,
	enabled: boolean,
	tabId?: number,
) => {
	const allTweaks = await getAllTweaks();

	if (!allTweaks[themeName]?.cssProperties[propertyName]) {
		logger.warn("Cannot toggle non-existent property", {
			themeName,
			propertyName,
		});
		return;
	}

	// Simply update the enabled flag
	allTweaks[themeName].cssProperties[propertyName].enabled = enabled;

	try {
		const dataToSave: StorageData = { theme_tweaks: allTweaks };
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
	deleteProperty,
	deleteTweaks,
	setDisabled,
	setPropertyEnabled,
	getGlobalDisabled,
	setGlobalDisabled,
};
