import { colord } from "colord";
import { DERIVED_COLORS } from "@/constants/derived-colors";
import { PROPERTIES } from "@/constants/properties";
import type { WorkingTweaks } from "@/types/tweaks";

/**
 * Gets all property values as an object for copying to clipboard
 * Returns object with property names as keys and current values (custom or initial)
 */
export const getExportJson = (tweaks: WorkingTweaks) => {
	const result: Record<string, string> = {};

	for (const { propertyName } of PROPERTIES) {
		const entry = tweaks.cssProperties[propertyName];

		if (entry) {
			// Include current value (custom or initial)
			result[propertyName] =
				entry.enabled && entry.value !== null
					? entry.value
					: entry.initialValue;
		}
	}

	const json = JSON.stringify(result, null, 2);

	return json;
};

export const getScriptString = (workingTweaks: WorkingTweaks) => {
	const properties = PROPERTIES.flatMap((item) => {
		const entry = workingTweaks.cssProperties[item.propertyName];
		const derived = DERIVED_COLORS[item.propertyName];

		if (!entry && !derived) return [];

		const value =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		if (derived) {
			return derived.map((item) => ({
				name: item.propertyName,
				value: item.derive(value),
			}));
		}

		return { name: item.propertyName, value };
	});

	const script = `(function() { ${JSON.stringify(properties)}.forEach(({ name, value }) => { document.documentElement.style.setProperty(name, value) }) })()`;

	return script;
};

export const parseImportJSON = (
	input: string,
): Record<string, string> | null => {
	try {
		const parsed = JSON.parse(input);

		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return null;
		}

		for (const [key, value] of Object.entries(parsed)) {
			if (
				typeof key !== "string" ||
				typeof value !== "string" ||
				!colord(value).isValid()
			) {
				delete parsed[key];
			}
		}

		return parsed as Record<string, string>;
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
