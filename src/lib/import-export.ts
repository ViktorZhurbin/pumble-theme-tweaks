import { colord } from "colord";
import { BASE_PROPERTY_NAMES } from "@/constants/properties";
import { ColorDerivation } from "@/lib/color-derivation";
import type { StoredCssProperties } from "@/types/storage";
import type { WorkingTweaks } from "@/types/tweaks";

/**
 * Gets all property values as an object for copying to clipboard
 * Returns object with property names as keys and current values (custom or initial)
 * Exports all properties (base + derived computed from base)
 */
export const getExportJson = (tweaks: WorkingTweaks) => {
	const result: Record<string, string> = {};

	// Export base properties and compute their derived colors
	for (const basePropertyName of BASE_PROPERTY_NAMES) {
		const entry = tweaks.cssProperties[basePropertyName];

		if (entry) {
			const baseValue =
				entry.enabled && entry.value !== null
					? entry.value
					: entry.initialValue;

			// Add base property
			result[basePropertyName] = baseValue;

			// // Compute and add derived colors
			// const derivedColors = ColorDerivation.computeDerivedColorsFromBase(
			// 	basePropertyName,
			// 	baseValue,
			// );

			// Object.assign(result, derivedColors);
		}
	}

	const json = JSON.stringify(result, null, 2);

	return json;
};

/**
 * Generates a script string that can be run in DevTools console
 * Includes all properties (base + derived computed from base)
 */
export const getScriptString = (workingTweaks: WorkingTweaks) => {
	const properties: Array<{ name: string; value: string }> = [];

	// Generate script with base + derived colors
	for (const basePropertyName of BASE_PROPERTY_NAMES) {
		const entry = workingTweaks.cssProperties[basePropertyName];

		if (!entry) continue;

		const baseValue =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		// Add base property
		properties.push({ name: basePropertyName, value: baseValue });

		// Add derived colors
		const derivedColors = ColorDerivation.computeDerivedColorsFromBase(
			basePropertyName,
			baseValue,
		);

		for (const [name, value] of Object.entries(derivedColors)) {
			properties.push({ name, value });
		}
	}

	const script = `(function() { ${JSON.stringify(properties)}.forEach(({ name, value }) => { document.documentElement.style.setProperty(name, value) }) })()`;

	return script;
};

/**
 * Parses imported JSON and converts to stored CSS properties format
 * Provides backward compatibility: accepts imports with only base properties
 * and auto-computes derived colors. If derived colors are provided, they are
 * recomputed from base (base wins).
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

		// Loop over base properties only
		for (const basePropertyName of BASE_PROPERTY_NAMES) {
			const value = parsed[basePropertyName];

			if (typeof value === "string" && colord(value).isValid()) {
				// Save base property
				cssProperties[basePropertyName] = { value, enabled: true };

				// Compute and add derived colors (override any manually-set derived)
				const derivedColors = ColorDerivation.computeDerivedColorsFromBase(
					basePropertyName,
					value,
				);

				for (const [derivedProp, derivedValue] of Object.entries(
					derivedColors,
				)) {
					cssProperties[derivedProp] = { value: derivedValue, enabled: true };
				}
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
