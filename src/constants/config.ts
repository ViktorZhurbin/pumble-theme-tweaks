import type { CSSVariableConfig } from "@/types";

/**
 * Configuration for CSS variables that can be customized
 */
export const CSS_VARIABLES: CSSVariableConfig[] = [
	{
		label: "Top & sidebar",
		propertyName: "--palette-secondary-main",
	},
	{
		label: "Create button",
		propertyName: "--palette-primary-main",
	},
	{
		label: "Main view bg",
		propertyName: "--background",
	},
];

export const PROPERTY_NAMES = CSS_VARIABLES.map((v) => v.propertyName);
