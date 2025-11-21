import { PROPERTY_NAMES } from "../constants/config";

/**
 * Applies a CSS variable to the document root
 */
const applyCSSVariable = (name: string, value: string) => {
	document.documentElement.style.setProperty(name, value);
};

/**
 * Removes only CSS variables that were applied by this extension
 */
const resetCSSOverrides = () => {
	for (const propertyName of PROPERTY_NAMES) {
		document.documentElement.style.removeProperty(propertyName);
	}
};

/**
 * Gets the current theme name from the first class on the html element
 */
const getCurrentTheme = () => {
	return document.documentElement.classList[0] || null;
};

/**
 * Reads current computed values of CSS variables
 */
const getCSSVariables = () => {
	const computed = getComputedStyle(document.documentElement);

	return PROPERTY_NAMES.reduce<Record<string, string>>((acc, propertyName) => {
		acc[propertyName] = computed.getPropertyValue(propertyName).trim();

		return acc;
	}, {});
};

export const DomUtils = {
	applyCSSVariable,
	resetCSSOverrides,
	getCurrentTheme,
	getCSSVariables,
};
