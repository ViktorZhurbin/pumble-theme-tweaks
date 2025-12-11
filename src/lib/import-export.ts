import { colord } from "colord";
import { PICKER_IDS } from "@/constants/properties";
import { ColorDerivation } from "@/lib/color-derivation";
import type { StoredCssProperties } from "@/types/storage";
import type { WorkingTweaks } from "@/types/tweaks";

/**
 * Gets picker values as JSON for copying to clipboard
 * Exports only picker values (storage keys), not computed CSS properties
 */
export const getExportJson = (tweaks: WorkingTweaks) => {
	const result: Record<string, string> = {};

	// Export only picker values
	for (const pickerId of PICKER_IDS) {
		const entry = tweaks.cssProperties[pickerId];

		if (entry) {
			const pickerValue =
				entry.enabled && entry.value !== null
					? entry.value
					: entry.initialValue;

			result[pickerId] = pickerValue;
		}
	}

	const json = JSON.stringify(result, null, 2);

	return json;
};

/**
 * Generates a script string that can be run in DevTools console
 * Includes all CSS properties (computed from picker values)
 */
export const getScriptString = (workingTweaks: WorkingTweaks) => {
	const properties: Array<{ name: string; value: string }> = [];

	// Compute all CSS properties from picker values
	for (const pickerId of PICKER_IDS) {
		const entry = workingTweaks.cssProperties[pickerId];

		if (!entry) continue;

		const pickerValue =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		// Compute CSS properties from picker value
		const cssProperties = ColorDerivation.computeCssProperties(
			pickerId,
			pickerValue,
		);

		for (const [name, value] of Object.entries(cssProperties)) {
			properties.push({ name, value });
		}
	}

	const script = `(function() { ${JSON.stringify(properties)}.forEach(({ name, value }) => { document.documentElement.style.setProperty(name, value) }) })()`;

	return script;
};

/**
 * Parses imported JSON and converts to stored CSS properties format
 * Stores only picker values (not computed CSS properties)
 * CSS properties are computed on-the-fly when applying to DOM
 */
export const parseImportJSON = (input: string): StoredCssProperties | null => {
	try {
		const parsed: Record<string, string> = JSON.parse(input);
		const cssProperties: StoredCssProperties = {};

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return null;
		}

		// Extract only picker values
		for (const pickerId of PICKER_IDS) {
			const value = parsed[pickerId];

			if (typeof value === "string" && colord(value).isValid()) {
				// Store only picker value (opaque base color)
				cssProperties[pickerId] = { value, enabled: true };
			}
		}

		return cssProperties;
	} catch {
		return null;
	}
};

const ERROR_MESSAGES = {
	EMPTY: "Please paste JSON with valid theme variables to import",
	INVALID_FORMAT:
		"Invalid theme format. Expected JSON object with property names and colors",
};

export const validateImport = (value: string) => {
	const input = value.trim();

	if (!input) {
		return ERROR_MESSAGES.EMPTY;
	}

	const parsed = parseImportJSON(input);
	if (!parsed) {
		return ERROR_MESSAGES.INVALID_FORMAT;
	}

	if (Object.keys(parsed).length === 0) {
		return ERROR_MESSAGES.EMPTY;
	}

	return null;
};
