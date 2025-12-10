import { browser } from "wxt/browser";
import { logger } from "@/lib/logger";
import type {
	StorageData,
	StoredCssProperties,
	StoredPreset,
	StoredPresets,
	StoredWorkingTweaks,
} from "@/types/storage";
import { Utils } from "./utils";

/**
 * Gets the tweaks enabled state
 */
const getTweaksOn = async (): Promise<boolean> => {
	try {
		const result = (await browser.storage.sync.get("tweaks_on")) as StorageData;

		return result.tweaks_on ?? true; // Default to enabled
	} catch (err) {
		logger.error("Storage read error:", err);
		return true;
	}
};

/**
 * Sets the tweaks enabled state
 */
const setTweaksOn = async (enabled: boolean) => {
	try {
		const dataToSave: StorageData = { tweaks_on: enabled };

		await browser.storage.sync.set(dataToSave);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * NEW PRESET-BASED STORAGE METHODS
 */

/**
 * Gets working tweaks from storage
 */
const getWorkingTweaks = async (): Promise<StoredWorkingTweaks> => {
	try {
		const result = (await browser.storage.sync.get(
			"working_tweaks",
		)) as StorageData;

		return result.working_tweaks ?? { cssProperties: {} };
	} catch (err) {
		logger.error("Storage read error:", err);
		return { cssProperties: {} };
	}
};

/**
 * Sets working tweaks in storage
 */
const setWorkingTweaks = async (cssProperties: StoredCssProperties) => {
	try {
		const dataToSave: StorageData = {
			working_tweaks: { cssProperties },
		};

		await browser.storage.sync.set(dataToSave);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * Saves a single CSS property to working state
 * (Only base properties; derived colors computed when needed)
 */
const saveWorkingProperty = async (propertyName: string, value: string) => {
	const workingTweaks = await getWorkingTweaks();

	workingTweaks.cssProperties[propertyName] = {
		value,
		enabled: workingTweaks.cssProperties[propertyName]?.enabled ?? true,
	};

	await setWorkingTweaks(workingTweaks.cssProperties);
};

const saveWorkingPropertyDebounced = Utils.debounce(
	(propertyName: string, value: string) => {
		Storage.saveWorkingProperty(propertyName, value);
	},
	500,
);

/**
 * Clears working tweaks
 */
const clearWorkingTweaks = async () => {
	await setWorkingTweaks({});
};

/**
 * Gets selected preset name
 */
const getSelectedPreset = async (): Promise<string | null> => {
	try {
		const result = (await browser.storage.sync.get(
			"selected_preset",
		)) as StorageData;

		return result.selected_preset ?? null;
	} catch (err) {
		logger.error("Storage read error:", err);
		return null;
	}
};

/**
 * Sets selected preset name
 */
const setSelectedPreset = async (presetName: string | null) => {
	try {
		const dataToSave: StorageData = {
			selected_preset: presetName,
		};

		await browser.storage.sync.set(dataToSave);
	} catch (err) {
		logger.warn("Storage write error:", err);
	}
};

/**
 * Gets all presets
 */
const getAllPresets = async (): Promise<StoredPresets> => {
	try {
		const result = (await browser.storage.sync.get(
			"saved_presets",
		)) as StorageData;

		return result.saved_presets ?? {};
	} catch (err) {
		logger.error("Storage read error:", err);
		return {};
	}
};

/**
 * Gets a single preset by name
 */
const getPreset = async (name: string): Promise<StoredPreset | undefined> => {
	const allPresets = await getAllPresets();

	return allPresets[name];
};

/**
 * Creates a new preset
 */
const createPreset = async (
	name: string,
	cssProperties: StoredCssProperties,
) => {
	const allPresets = await getAllPresets();

	if (allPresets[name]) {
		throw new Error(`Preset "${name}" already exists`);
	}

	allPresets[name] = {
		name,
		cssProperties,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	try {
		const dataToSave: StorageData = { saved_presets: allPresets };

		await browser.storage.sync.set(dataToSave);
		logger.info("Storage: Created preset", { name });
	} catch (err) {
		logger.error("Storage: Create preset error:", err);
		throw err;
	}
};

/**
 * Updates an existing preset
 */
const updatePreset = async (
	name: string,
	cssProperties: StoredCssProperties,
) => {
	const allPresets = await getAllPresets();

	if (!allPresets[name]) {
		throw new Error(`Preset "${name}" does not exist`);
	}

	allPresets[name] = {
		...allPresets[name],
		cssProperties,
		updatedAt: new Date().toISOString(),
	};

	try {
		const dataToSave: StorageData = { saved_presets: allPresets };

		await browser.storage.sync.set(dataToSave);
		logger.info("Storage: Updated preset", { name });
	} catch (err) {
		logger.error("Storage: Update preset error:", err);
		throw err;
	}
};

/**
 * Deletes a preset
 */
const deletePreset = async (name: string) => {
	const allPresets = await getAllPresets();

	if (!allPresets[name]) {
		logger.warn("Storage: Cannot delete non-existent preset", { name });
		return;
	}

	delete allPresets[name];

	try {
		const dataToSave: StorageData = { saved_presets: allPresets };

		await browser.storage.sync.set(dataToSave);
		logger.info("Storage: Deleted preset", { name });
	} catch (err) {
		logger.error("Storage: Delete preset error:", err);
		throw err;
	}
};

/**
 * Renames a preset
 */
const renamePreset = async (oldName: string, newName: string) => {
	const allPresets = await getAllPresets();

	if (!allPresets[oldName]) {
		throw new Error(`Preset "${oldName}" does not exist`);
	}

	if (allPresets[newName]) {
		throw new Error(`Preset "${newName}" already exists`);
	}

	allPresets[newName] = {
		...allPresets[oldName],
		name: newName,
		updatedAt: new Date().toISOString(),
	};

	delete allPresets[oldName];

	try {
		const dataToSave: StorageData = { saved_presets: allPresets };

		// If the renamed preset is currently selected, update selected_preset
		const currentSelected = await getSelectedPreset();
		if (currentSelected === oldName) {
			dataToSave.selected_preset = newName;
		}

		await browser.storage.sync.set(dataToSave);
		logger.info("Storage: Renamed preset", { oldName, newName });
	} catch (err) {
		logger.error("Storage: Rename preset error:", err);
		throw err;
	}
};

export const Storage = {
	// Tweaks toggle
	getTweaksOn,
	setTweaksOn,

	// Working state
	getWorkingTweaks,
	setWorkingTweaks,
	saveWorkingProperty,
	saveWorkingPropertyDebounced,
	clearWorkingTweaks,

	// Presets
	getSelectedPreset,
	setSelectedPreset,
	getAllPresets,
	getPreset,
	createPreset,
	updatePreset,
	deletePreset,
	renamePreset,
};
