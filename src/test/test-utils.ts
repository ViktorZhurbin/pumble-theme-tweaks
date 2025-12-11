/**
 * Test utilities and helpers
 */

import type { StoredPreset, StoredPresets } from "@/types/storage";
import type { TweakEntry, WorkingTweaks } from "@/types/tweaks";

/**
 * Create a mock WorkingTweaks object for testing
 */
export function createMockWorkingTweaks(
	overrides?: Partial<WorkingTweaks>,
): WorkingTweaks {
	return {
		cssProperties: {},
		...overrides,
	};
}

/**
 * Create a mock TweakEntry for testing
 */
export function createMockTweakEntry(
	value: string,
	initialValue: string = "#000000",
	enabled: boolean = true,
): TweakEntry {
	return {
		value,
		initialValue,
		enabled,
	};
}

/**
 * Create a mock StoredPresets object for testing
 */
export function createMockStoredPresets(
	presetNames: string[] = [],
): StoredPresets {
	const presets: StoredPresets = {};

	for (const name of presetNames) {
		presets[name] = {
			cssProperties: {},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}

	return presets;
}

/**
 * Create a mock StoredPreset with some default colors
 */
export function createMockPreset(): StoredPreset {
	return {
		cssProperties: {
			"--left-nav-text-high": {
				value: "#ffffff",
				enabled: true,
			},
			"--left-nav-bg-high": {
				value: "#1a1a1a",
				enabled: true,
			},
		},
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}
