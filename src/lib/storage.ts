import type { StorageData, ThemePresets } from "@/types";

/**
 * Gets all theme presets from storage
 */
export async function getAllStoredPresets() {
	const result = await chrome.storage.sync.get<StorageData>("theme_presets");

	return result.theme_presets ?? {};
}

/**
 * Gets preset for a specific theme
 */
export async function getStoredPreset(
	themeName: string,
): Promise<ThemePresets[string] | undefined> {
	const presets = await getAllStoredPresets();

	return presets[themeName];
}

/**
 * Saves a single CSS variable for a theme
 */
export async function saveStoredPresetVar(
	themeName: string,
	varName: string,
	value: string,
) {
	const presets = await getAllStoredPresets();

	if (!presets[themeName]) {
		presets[themeName] = {};
	}
	presets[themeName][varName] = value;

	try {
		await chrome.storage.sync.set({ theme_presets: presets });
	} catch (err) {
		console.warn("Storage write error:", err);
	}
}

/**
 * Deletes all overrides for a specific theme
 */
export async function deleteStoredPreset(themeName: string) {
	const presets = await getAllStoredPresets();

	if (presets[themeName]) {
		delete presets[themeName];
		await chrome.storage.sync.set({ theme_presets: presets });
	}
}
