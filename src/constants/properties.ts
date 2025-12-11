import { colord } from "colord";

/**
 * Color control configuration for color customization
 *
 * Architecture:
 * - id = Storage key for picker value (opaque HEX color)
 * - Picker values stored in state/storage, NOT applied to DOM directly
 * - Source for computing actual CSS properties
 *
 * - cssProperties = CSS properties to apply to DOM
 * - Computed on-the-fly when applying
 * - ALWAYS defined (even if just identity transform)
 */
type PickerItem = {
	label: string;
	/** Storage key for the picker value (opaque base color) */
	id: string;
	/**
	 * CSS properties to compute from this picker value.
	 * ALWAYS defined - includes identity transform if property doesn't need transformation.
	 */
	cssProperties: CssPropertyConfig[];
};

type CssPropertyConfig = {
	/** CSS property name to apply to DOM */
	propertyName: string;
	/** Transform function: picker color → CSS value */
	derive: (baseColor: string) => string;
};

/**
 * Color control definitions
 *
 * Keys are picker IDs (storage keys for opaque picker values)
 * Values define how to compute CSS properties from the picker value
 */
export const COLOR_PICKERS_MAP: Record<string, PickerItem> = {
	"--palette-secondary-main": {
		label: "Top & sidebar",
		id: "--palette-secondary-main",
		// Picker value applied as-is (identity), plus derived variants
		cssProperties: [
			{
				propertyName: "--palette-secondary-main",
				derive: (base) => base, // Identity: picker value = CSS value
			},
			{
				propertyName: "--palette-secondary-dark",
				derive: (base) => colord(base).darken(0.2).toRgbString(),
			},
			{
				propertyName: "--palette-secondary-light",
				derive: (base) => colord(base).lighten(0.2).toRgbString(),
			},
		],
	},
	"--left-nav-text-high": {
		label: "Sidebar text",
		id: "--left-nav-text-high",
		// Picker value is opaque, CSS needs alpha variants
		cssProperties: [
			{
				propertyName: "--left-nav-hover",
				derive: (base) => colord(base).alpha(0.22).toRgbString(),
			},
			{
				propertyName: "--left-nav-selected",
				derive: (base) => colord(base).alpha(0.34).toRgbString(),
			},
			{
				propertyName: "--left-nav-icons",
				derive: (base) => colord(base).alpha(0.74).toRgbString(),
			},
			{
				propertyName: "--left-nav-text-medium",
				derive: (base) => colord(base).alpha(0.8).toRgbString(),
			},
			{
				// Picker value transforms to CSS with alpha
				propertyName: "--left-nav-text-high",
				derive: (base) => colord(base).alpha(0.87).toRgbString(),
			},
		],
	},
	"--palette-primary-main": {
		label: "Create button",
		id: "--palette-primary-main",
		// Identity: picker value = CSS value
		cssProperties: [
			{
				propertyName: "--palette-primary-main",
				derive: (base) => base,
			},
			{
				propertyName: "--create-button-hover",
				derive: (base) => colord(base).alpha(0.7).toRgbString(),
			},
		],
	},
	"--background": {
		label: "Main view bg",
		id: "--background",
		// Identity: picker value = CSS value
		cssProperties: [
			{
				propertyName: "--background",
				derive: (base) => base,
			},
		],
	},
	"--warning-high": {
		label: "Unread badge",
		id: "--warning-high",
		// Identity: picker value = CSS value
		cssProperties: [
			{
				propertyName: "--warning-high",
				derive: (base) => base,
			},
		],
	},
};

export const PICKER_IDS = Object.keys(COLOR_PICKERS_MAP);
export const COLOR_PICKERS = Object.values(COLOR_PICKERS_MAP);

/**
 * All CSS property names that will be applied to DOM
 * (computed from all cssProperties across all controls)
 */
export const ALL_PROPERTY_NAMES = COLOR_PICKERS.flatMap((pikerItem) =>
	pikerItem.cssProperties.map((css) => css.propertyName),
);
