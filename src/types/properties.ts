/**
 * Configuration for a CSS property that can be customized
 */
export interface PropertyItem {
	label: string;
	propertyName: string;
}

/**
 * Configuration for a derived color
 */
export type DerivedColorConfig = {
	propertyName: string;
	derive: (baseColor: string) => string;
};

/**
 * Registry mapping base property names to their derived colors
 */
export type DerivedColorRegistry = Record<string, DerivedColorConfig[]>;
