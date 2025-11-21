import { PROPERTY_NAMES } from "./config";

/**
 * Applies a CSS variable to the document root
 */
export function applyCSSVariable(name: string, value: string) {
	document.documentElement.style.setProperty(name, value);
}

/**
 * Removes only CSS variables that were applied by this extension
 */
export function resetCSSOverrides() {
	PROPERTY_NAMES.forEach((propertyName) => {
		document.documentElement.style.removeProperty(propertyName);
	});
}

/**
 * Gets the current theme name from the first class on the html element
 */
export function getCurrentTheme() {
	return document.documentElement.classList[0] || null;
}

/**
 * Reads current computed values of CSS variables
 */
export function readCSSVariables(variableNames: string[]) {
	const computed = getComputedStyle(document.documentElement);
	const values: Record<string, string> = {};

	variableNames.forEach((name) => {
		values[name] = computed.getPropertyValue(name).trim();
	});

	return values;
}
