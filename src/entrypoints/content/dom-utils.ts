import { ALL_PROPERTY_NAMES, COLOR_PICKERS_MAP } from "@/constants/properties";

/**
 * Applies a CSS property to the document root
 */
const applyCSSProperty = (name: string, value: string) => {
	document.documentElement.style.setProperty(name, value);
};

const applyManyCSSProperties = (properties: Record<string, string>) => {
	for (const [propertyName, value] of Object.entries(properties)) {
		applyCSSProperty(propertyName, value);
	}
};

/**
 * Removes a CSS property from the document root
 */
const removeCSSProperty = (name: string) => {
	document.documentElement.style.removeProperty(name);
};

/**
 * Removes all CSS properties that were applied by this extension
 * (base properties + derived colors)
 */
const resetCSSTweaks = () => {
	for (const propertyName of ALL_PROPERTY_NAMES) {
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
 * Returns all properties applied to DOM by this extension
 */
const getCSSProperties = () => {
	const computed = getComputedStyle(document.documentElement);

	return ALL_PROPERTY_NAMES.reduce<Record<string, string>>(
		(acc, propertyName) => {
			const value = computed.getPropertyValue(propertyName).trim();

			if (value) {
				acc[propertyName] = value;
			}

			return acc;
		},
		{},
	);
};

/**
 * Checks if a picker item has been applied to DOM
 */
const isPropertyModified = (propertyName: string): boolean => {
	return (
		propertyName in COLOR_PICKERS_MAP &&
		!!document.documentElement.style.getPropertyValue(propertyName)
	);
};

export const DomUtils = {
	applyCSSProperty,
	applyManyCSSProperties,
	removeCSSProperty,
	getCSSProperties,
	resetCSSTweaks,
	getCurrentTheme,
	isPropertyModified,
};
