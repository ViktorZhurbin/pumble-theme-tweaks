/**
 * Configuration for a CSS property that can be customized
 */
export interface PropertyItem {
	label: string;
	propertyName: string;
}

/**
 * Theme tweaks stored in browser.storage
 * Maps theme name to customized CSS properties
 */
export interface ThemeTweaks {
	disabled: boolean;
	cssProperties: {
		[propertyName: string]: string;
	};
}

export type ThemeTweaksRecord = Record<string, ThemeTweaks>;

/**
 * Storage data structure
 */
export interface StorageData {
	theme_tweaks?: ThemeTweaksRecord;
	global_disabled?: boolean;
	last_update_tab_id?: number;
}
