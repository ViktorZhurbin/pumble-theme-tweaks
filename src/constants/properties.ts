import { colord } from "colord";

type PropertyItem = {
	label: string;
	propertyName: string;
	/** Optional transform for color picker display (e.g., strip alpha) */
	displayColor?: (color: string) => string;
	derivedProperties?: DerivedColorConfig[];
};

type DerivedColorConfig = {
	propertyName: string;
	derive: (baseColor: string) => string;
};

/**
 * Configuration for CSS properties that can be customized
 */
export const PROPERTIES_MAP: Record<string, PropertyItem> = {
	"--palette-secondary-main": {
		label: "Top & sidebar",
		propertyName: "--palette-secondary-main",
		derivedProperties: [
			{
				propertyName: "--palette-secondary-dark",
				derive: (baseColor) => colord(baseColor).darken(0.2).toRgbString(),
			},
			{
				propertyName: "--palette-secondary-light",
				derive: (baseColor) => colord(baseColor).lighten(0.2).toRgbString(),
			},
		],
	},
	"--left-nav-text-high": {
		label: "Sidebar text",
		propertyName: "--left-nav-text-high",
		/** Strip alpha for color picker (Chrome only accepts 6-char hex) */
		displayColor: (color) => colord(color).alpha(1).toHex(),
		derivedProperties: [
			{
				propertyName: "--left-nav-hover",
				derive: (baseColor) => colord(baseColor).alpha(0.22).toRgbString(),
			},
			{
				propertyName: "--left-nav-selected",
				derive: (baseColor) => colord(baseColor).alpha(0.34).toRgbString(),
			},
			{
				propertyName: "--left-nav-icons",
				derive: (baseColor) => colord(baseColor).alpha(0.74).toRgbString(),
			},
			{
				propertyName: "--left-nav-text-medium",
				derive: (baseColor) => colord(baseColor).alpha(0.8).toRgbString(),
			},
			{
				propertyName: "--left-nav-text-high",
				derive: (baseColor) => colord(baseColor).alpha(0.87).toRgbString(),
			},
		],
	},
	"--palette-primary-main": {
		label: "Create button",
		propertyName: "--palette-primary-main",
	},
	"--background": {
		label: "Main view bg",
		propertyName: "--background",
	},
};

export const PROPERTIES = Object.values(PROPERTIES_MAP);

export const BASE_PROPERTY_NAMES = Object.keys(PROPERTIES_MAP);

/**
 * All CSS property names including base properties and their derived colors
 * (e.g., base: "--palette-secondary-main" + derived: "--palette-secondary-dark", "--palette-secondary-light")
 */
export const ALL_PROPERTY_NAMES = PROPERTIES.flatMap((item) => {
	let derived: string[] = [];

	if (item.derivedProperties) {
		derived = item.derivedProperties.map((prop) => prop.propertyName);
	}

	return [item.propertyName, ...derived];
});
