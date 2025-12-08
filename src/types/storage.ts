/**
 * Stored tweak entry (persisted to browser.storage)
 * Does not include initialValue, which is computed from DOM at runtime
 */
export interface StoredTweakEntry {
	value: string;
	enabled: boolean;
}

/**
 * Preset data (persisted to browser.storage)
 */
export interface StoredPreset {
	name: string;
	cssProperties: Record<string, StoredTweakEntry>;
	createdAt: string;
	updatedAt: string;
}

/**
 * Storage data structure (preset-based format)
 */
export interface StorageData {
	working_tweaks?: {
		cssProperties: Record<string, StoredTweakEntry>;
	};
	selected_preset?: string | null;
	saved_presets?: Record<string, StoredPreset>;
	tweaks_on?: boolean;
	last_update_tab_id?: number;
}
