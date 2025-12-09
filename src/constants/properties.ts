import type { PropertyItem } from "@/types/properties";

/**
 * Configuration for CSS properties that can be customized
 */
export const PROPERTIES: PropertyItem[] = [
	{
		label: "Top & sidebar",
		propertyName: "--palette-secondary-main",
	},
	{
		label: "Sidebar text",
		propertyName: "--left-nav-text",
	},
	{
		label: "Create button",
		propertyName: "--palette-primary-main",
	},
	// {
	// 	label: "Logo color",
	// 	propertyName: "--logo-color",
	// },
	{
		label: "Main view bg",
		propertyName: "--background",
	},
];

export const PROPERTY_NAMES = PROPERTIES.map((v) => v.propertyName);
