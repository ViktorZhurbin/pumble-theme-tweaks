/**
 * Configuration for a CSS property that can be customized
 */
export interface PropertyItem {
	label: string;
	propertyName: string;
}

/**
 * Runtime tweak entry (includes computed initialValue from DOM)
 */
export interface TweakEntry {
	value: string | null; // User's custom value (null = not tweaked)
	initialValue: string; // Fresh from DOM on init (NOT stored)
	enabled: boolean;
}

/**
 * Runtime theme tweaks (includes computed initialValues)
 */
export interface ThemeTweaks {
	disabled: boolean;
	cssProperties: {
		[propertyName: string]: TweakEntry;
	};
}

/**
 * Stored tweak entry (persisted to browser.storage)
 * Does not include initialValue, which is computed from DOM at runtime
 */
export interface StoredTweakEntry {
	value: string;
	enabled: boolean;
}

/**
 * Stored theme tweaks (persisted to browser.storage)
 */
export interface StoredThemeTweaks {
	disabled: boolean;
	cssProperties: {
		[propertyName: string]: StoredTweakEntry;
	};
}

export type StoredThemeTweaksRecord = Record<string, StoredThemeTweaks>;

/**
 * Storage data structure
 */
export interface StorageData {
	theme_tweaks?: StoredThemeTweaksRecord;
	global_disabled?: boolean;
	last_update_tab_id?: number;
}

/**
 * Configuration for a derived color
 */
export type DerivedColorConfig = {
	propertyName: string;
	derive: (baseColor: string) => string;
};

/**
 * Registry mapping base property names to their derived colors
 */
export type DerivedColorRegistry = Record<string, DerivedColorConfig[]>;
