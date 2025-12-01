import { DERIVED_COLORS } from "@/constants/derived-colors";

/**
 * Utility module for managing derived color generation and application
 */
export const ColorDerivation = {
	/**
	 * Applies derived colors for a base property
	 * @param basePropertyName - The base CSS property name (e.g., "--palette-primary-main")
	 * @param baseValue - The base color value
	 */
	applyDerivedColors(basePropertyName: string, baseValue: string) {
		const derivedConfigs = DERIVED_COLORS[basePropertyName];

		if (!derivedConfigs) return;

		for (const config of derivedConfigs) {
			const derivedValue = config.derive(baseValue);

			document.documentElement.style.setProperty(
				config.propertyName,
				derivedValue,
			);
		}
	},

	/**
	 * Removes derived colors for a base property
	 * @param basePropertyName - The base CSS property name
	 */
	removeDerivedColors(basePropertyName: string) {
		const derivedConfigs = DERIVED_COLORS[basePropertyName];
		if (!derivedConfigs) return;

		for (const config of derivedConfigs) {
			document.documentElement.style.removeProperty(config.propertyName);
		}
	},

	/**
	 * Gets all derived property names across all base properties
	 * @returns Array of all derived CSS property names
	 */
	getAllDerivedPropertyNames(): string[] {
		return Object.values(DERIVED_COLORS)
			.flat()
			.map((config) => config.propertyName);
	},
};
