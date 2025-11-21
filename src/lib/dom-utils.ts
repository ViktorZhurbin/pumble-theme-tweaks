import { PROPERTY_NAMES } from "@/constants/config";

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
 * Gets the current theme name from the html element classes
 * Assumes theme is one of the classes on the root element
 */
const getCurrentTheme = (): string | null => {
	const classList = Array.from(document.documentElement.classList);

	// Look for theme-like classes
	const themeClass = classList.find(
		(className) => className.includes("dark") || className.includes("light"),
	);

	return themeClass || null;
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
