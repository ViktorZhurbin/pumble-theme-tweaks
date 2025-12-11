import { parseImportJSON } from "@/lib/import-export";
import type { StoredCssProperties } from "@/types/storage";

interface PredefinedPreset {
	name: string;
	cssProperties: StoredCssProperties;
}

// Raw preset JSONs with only picker values (will be parsed and converted to StoredCssProperties)
const RAW_PRESETS: Record<string, Record<string, string>> = {
	Boss: {
		"--palette-secondary-main": "#231627",
		"--left-nav-text-high": "#f0eef1",
		"--palette-primary-main": "#8b46a4",
		"--background": "#050505",
		"--warning-high": "rgb(255, 87, 34)",
	},
	Matrix: {
		"--palette-secondary-main": "#121212",
		"--left-nav-text-high": "rgba(10, 240, 37, 0.87)",
		"--palette-primary-main": "#2e9447",
		"--background": "#101911",
		"--warning-high": "rgb(255, 87, 34)",
	},
	Pinky: {
		"--palette-secondary-main": "#783a68",
		"--left-nav-text-high": "rgba(244, 241, 244, 0.87)",
		"--palette-primary-main": "#d322bb",
		"--background": "#171117",
		"--warning-high": "rgb(255, 87, 34)",
	},
};

/**
 * Get predefined presets with properly formatted StoredCssProperties
 * Each preset's cssProperties is converted from raw color values to StoredCssProperties
 */
const getPredefinedPresets = (): PredefinedPreset[] => {
	const presets: PredefinedPreset[] = [];

	for (const [name, rawPreset] of Object.entries(RAW_PRESETS)) {
		const json = JSON.stringify(rawPreset);
		const cssProperties = parseImportJSON(json);

		if (cssProperties) {
			presets.push({ name, cssProperties });
		}
	}

	return presets;
};

export const predefinedPresets = getPredefinedPresets();
