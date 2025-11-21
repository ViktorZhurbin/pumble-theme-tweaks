import type { ThemePresets } from "@/types";

/**
 * Gets all theme presets from storage
 */
export async function getAllPresets(): Promise<ThemePresets> {
	const result = await chrome.storage.sync.get(["theme_presets"]);
	return result.theme_presets || {};
}

/**
 * Gets preset for a specific theme
 */
export async function getThemePreset(
	themeName: string,
): Promise<Record<string, string>> {
	const presets = await getAllPresets();
	return presets[themeName] || {};
}

/**
 * Saves a single CSS variable for a theme
 */
export async function saveThemeVariable(
	themeName: string,
	varName: string,
	value: string,
): Promise<void> {
	const presets = await getAllPresets();

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
export async function deleteThemePreset(themeName: string): Promise<void> {
	const presets = await getAllPresets();

	if (presets[themeName]) {
		delete presets[themeName];
		await chrome.storage.sync.set({ theme_presets: presets });
	}
}

/**
 * Gets all CSS variable names that are used across all presets
 */
export async function getAllUsedVariableNames(): Promise<Set<string>> {
	const presets = await getAllPresets();
	const varNames = new Set<string>();

	Object.values(presets).forEach((preset) => {
		Object.keys(preset).forEach((varName) => varNames.add(varName));
	});

	return varNames;
}
