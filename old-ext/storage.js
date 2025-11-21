/**
 * @typedef {import('./types.js').ThemePresets} ThemePresets
 * @typedef {import('./types.js').StorageData} StorageData
 */

/**
 * Gets all theme presets from storage
 * @returns {Promise<ThemePresets>}
 */
export async function getAllPresets() {
	const result = await chrome.storage.sync.get(['theme_presets']);
	return result.theme_presets || {};
}

/**
 * Gets preset for a specific theme
 * @param {string} themeName
 * @returns {Promise<Object.<string, string>>}
 */
export async function getThemePreset(themeName) {
	const presets = await getAllPresets();
	return presets[themeName] || {};
}

/**
 * Saves a single CSS variable for a theme
 * @param {string} themeName
 * @param {string} varName
 * @param {string} value
 * @returns {Promise<void>}
 */
export async function saveThemeVariable(themeName, varName, value) {
	const presets = await getAllPresets();
	
	if (!presets[themeName]) {
		presets[themeName] = {};
	}
	presets[themeName][varName] = value;

	try {
		await chrome.storage.sync.set({ theme_presets: presets });
	} catch (err) {
		console.warn('Storage write error:', err);
	}
}

/**
 * Deletes all overrides for a specific theme
 * @param {string} themeName
 * @returns {Promise<void>}
 */
export async function deleteThemePreset(themeName) {
	const presets = await getAllPresets();
	
	if (presets[themeName]) {
		delete presets[themeName];
		await chrome.storage.sync.set({ theme_presets: presets });
	}
}

/**
 * Gets all CSS variable names that are used across all presets
 * @returns {Promise<Set<string>>}
 */
export async function getAllUsedVariableNames() {
	const presets = await getAllPresets();
	const varNames = new Set();
	
	Object.values(presets).forEach((preset) => {
		Object.keys(preset).forEach((varName) => varNames.add(varName));
	});
	
	return varNames;
}
