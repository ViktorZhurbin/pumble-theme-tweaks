import { DERIVED_COLORS } from "@/constants/derived-colors";
import { PROPERTY_NAMES } from "@/constants/properties";
import { ColorDerivation } from "@/lib/color-derivation";

/**
 * Applies a CSS property to the document root
 */
const applyCSSProperty = (name: string, value: string) => {
	if (DERIVED_COLORS[name]) {
		ColorDerivation.applyDerivedColors(name, value);
	} else {
		document.documentElement.style.setProperty(name, value);
	}
};

/**
 * Applies a CSS property to the document root
 */
const removeCSSProperty = (name: string) => {
	if (DERIVED_COLORS[name]) {
		ColorDerivation.removeDerivedColors(name);
	} else {
		document.documentElement.style.removeProperty(name);
	}
};

/**
 * Removes only CSS properties that were applied by this extension
 */
const resetCSSTweaks = () => {
	for (const propertyName of PROPERTY_NAMES) {
		removeCSSProperty(propertyName);
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
 * Reads current computed values of CSS properties
 */
const getCSSProperties = () => {
	const computed = getComputedStyle(document.documentElement);

	return PROPERTY_NAMES.reduce<Record<string, string>>((acc, propertyName) => {
		acc[propertyName] = computed.getPropertyValue(propertyName).trim();

		return acc;
	}, {});
};

/**
 * Checks if a CSS property has been modified (exists as inline style)
 * Returns true if the property exists in element.style (applied by extension)
 * Returns false if the property only exists in computed styles (from stylesheet)
 */
const isPropertyModified = (propertyName: string): boolean => {
	return document.documentElement.style.getPropertyValue(propertyName) !== "";
};

export const DomUtils = {
	applyCSSProperty,
	removeCSSProperty,
	getCSSProperties,
	resetCSSTweaks,
	getCurrentTheme,
	isPropertyModified,
};
