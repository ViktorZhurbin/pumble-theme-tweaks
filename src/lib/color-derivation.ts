import { COLOR_PICKERS_MAP } from "@/constants/properties";

/**
 * Utility module for computing CSS properties from picker values
 */
export const ColorDerivation = {
	/**
	 * Computes all CSS properties from a picker value
	 * @param pickerId - The picker ID (storage key)
	 * @param pickerValue - The opaque HEX picker value
	 * @returns Record of CSS property names to computed values
	 */
	computeCssProperties(
		pickerId: string,
		pickerValue: string,
	): Record<string, string> {
		const result: Record<string, string> = {};
		const pickerItem = COLOR_PICKERS_MAP[pickerId];

		for (const cssProp of pickerItem.cssProperties) {
			const cssValue = cssProp.derive(pickerValue);

			result[cssProp.propertyName] = cssValue;
		}

		return result;
	},

	/**
	 * Gets all CSS property names for a specific picker control
	 * @param pickerId - The picker ID (storage key)
	 * @returns Array of CSS property names
	 */
	getCssPropertyNames(pickerId: string): string[] {
		const pickerItem = COLOR_PICKERS_MAP[pickerId];

		return pickerItem.cssProperties.map((css) => css.propertyName);
	},
};
