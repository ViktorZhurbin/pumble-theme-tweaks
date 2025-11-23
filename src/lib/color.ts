export const ALPHA_PRECISION = 3;

export const ColorUtils = {
	/**
	 * Converts rgb/rgba color string to hex format for color input
	 * Returns the original value if already in hex format
	 */
	toHex(color: string): string {
		// Already hex format
		if (color.startsWith("#")) {
			return color;
		}

		// Parse rgb/rgba format
		const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		if (!match) {
			return "#000000"; // Fallback if can't parse
		}

		const r = Number.parseInt(match[1], 10);
		const g = Number.parseInt(match[2], 10);
		const b = Number.parseInt(match[3], 10);

		// Convert to hex
		const componentToHex = (n: number) => n.toString(16).padStart(2, "0");

		return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
	},
};
