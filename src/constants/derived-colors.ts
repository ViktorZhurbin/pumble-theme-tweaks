import { colord } from "colord";
import type { DerivedColorRegistry } from "@/types/tweaks";

/**
 * Registry defining which base color properties generate derived colors
 * and how those derived colors are computed
 */
export const DERIVED_COLORS: DerivedColorRegistry = {
	"--palette-secondary-main": [
		{
			propertyName: "--palette-secondary-main",
			derive: (baseColor) => baseColor,
		},
		{
			propertyName: "--palette-secondary-dark",
			derive: (baseColor) => colord(baseColor).darken(0.2).toRgbString(),
		},
		{
			propertyName: "--palette-secondary-light",
			derive: (baseColor) => colord(baseColor).lighten(0.2).toRgbString(),
		},
	],

	// "--logo-color": [
	// 	{
	// 		propertyName: "--logo-color-themes",
	// 		derive: (baseColor) => baseColor,
	// 	},
	// 	{
	// 		propertyName: "--cas-toggle-button-icon-color",
	// 		derive: (baseColor) => baseColor,
	// 	},
	// ],

	"--left-nav-text": [
		{
			propertyName: "--left-nav-text",
			derive: (baseColor) => baseColor,
		},
		{
			propertyName: "--left-nav-hover",
			derive: (baseColor) => colord(baseColor).alpha(0.12).toRgbString(),
		},
		{
			propertyName: "--left-nav-selected",
			derive: (baseColor) => colord(baseColor).alpha(0.24).toRgbString(),
		},
		{
			propertyName: "--left-nav-icons",
			derive: (baseColor) => colord(baseColor).alpha(0.54).toRgbString(),
		},
		{
			propertyName: "--left-nav-text-medium",
			derive: (baseColor) => colord(baseColor).alpha(0.6).toRgbString(),
		},
		{
			propertyName: "--left-nav-text-high",
			derive: (baseColor) => colord(baseColor).alpha(0.87).toRgbString(),
		},
	],
	// "--palette-primary-main": [
	// 	{
	// 		propertyName: "--palette-primary-dark",
	// 		derive: (baseColor) => colord(baseColor).darken(0.15).toHex(),
	// 	},
	// 	{
	// 		propertyName: "--palette-primary-light",
	// 		derive: (baseColor) => colord(baseColor).lighten(0.15).toHex(),
	// 	},
	// ],
};
