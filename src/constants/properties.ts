import type { PropertyItem } from "@/types";

/**
 * Configuration for CSS properties that can be customized
 */
export const PROPERTIES: PropertyItem[] = [
	{
		label: "Top & sidebar",
		propertyName: "--palette-secondary-main",
	},
	{
		label: "Create button",
		propertyName: "--palette-primary-main",
	},
	// {
	// 	label: "Search border",
	// 	propertyName: "--main-search-stroke",
	// },
	{
		label: "Main view bg",
		propertyName: "--background",
	},
];

export const PROPERTY_NAMES = PROPERTIES.map((v) => v.propertyName);
