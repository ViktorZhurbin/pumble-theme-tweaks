import { PROPERTY_NAMES } from "@/constants/properties";

/**
 * Applies a CSS property to the document root
 */
const applyCSSProperty = (name: string, value: string) => {
	document.documentElement.style.setProperty(name, value);
};

/**
 * Removes only CSS properties that were applied by this extension
 */
const resetCSSTweaks = () => {
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

/**
 * Efficiently applies a set of CSS properties by comparing with current state
 * Only touches the DOM for properties that actually changed
 */
const applyTweaksDiff = (desiredProperties: Record<string, string>) => {
	for (const propertyName of PROPERTY_NAMES) {
		const desiredValue = desiredProperties[propertyName];
		const isCurrentlyModified = isPropertyModified(propertyName);
		const currentValue =
			document.documentElement.style.getPropertyValue(propertyName);

		if (desiredValue) {
			// We want this property set
			if (currentValue !== desiredValue) {
				applyCSSProperty(propertyName, desiredValue);
			}
		} else {
			// We want this property unset
			if (isCurrentlyModified) {
				document.documentElement.style.removeProperty(propertyName);
			}
		}
	}
};

export const DomUtils = {
	applyCSSProperty,
	getCSSProperties,
	resetCSSTweaks,
	getCurrentTheme,
	isPropertyModified,
	applyTweaksDiff,
};
