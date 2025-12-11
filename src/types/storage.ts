/**
 * Stored tweak entry (persisted to browser.storage)
 * Does not include initialValue, which is computed from DOM at runtime
 */
export interface StoredTweakEntry {
	value: string;
	enabled: boolean;
}

export type StoredCssProperties = Record<string, StoredTweakEntry>;

/**
 * Preset data (persisted to browser.storage)
 * Note: name is stored as the dictionary key, not duplicated here
 */
export interface StoredPreset {
	cssProperties: StoredCssProperties;
	createdAt: string;
	updatedAt: string;
}

export type StoredWorkingTweaks = {
	cssProperties: StoredCssProperties;
};

export type StoredPresets = Record<string, StoredPreset>;

/**
 * Storage data structure (preset-based format)
 */
export interface StorageData {
	working_tweaks?: StoredWorkingTweaks;
	selected_preset?: string | null;
	saved_presets?: StoredPresets;
	tweaks_on?: boolean;
}
