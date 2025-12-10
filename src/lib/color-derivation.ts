import { PROPERTIES_MAP } from "@/constants/properties";

/**
 * Utility module for managing derived color generation and application
 */
export const ColorDerivation = {
	computeDerivedColorsFromBase(
		basePropertyName: string,
		baseValue: string,
	): Record<string, string> {
		const result: Record<string, string> = {};
		const derivedColors = PROPERTIES_MAP[basePropertyName].derivedProperties;

		if (!derivedColors) {
			return result;
		}

		for (const item of derivedColors) {
			const derivedValue = item.derive(baseValue);
			result[item.propertyName] = derivedValue;
		}

		return result;
	},

	/**
	 * Gets all derived property names for a specific base property (including the base itself)
	 * @param basePropertyName - The base CSS property name
	 * @returns Array of property names (base + derived)
	 */
	getDerivedPropertyNamesForBase(basePropertyName: string): string[] {
		const derivedConfigs = PROPERTIES_MAP[basePropertyName].derivedProperties;

		if (!derivedConfigs) {
			return [];
		}

		return derivedConfigs.map((config) => config.propertyName);
	},
};
