/**
 * Applies a CSS variable to the document root with !important
 */
export function applyCSSVariable(name: string, value: string) {
	document.documentElement.style.setProperty(name, value);
}

/**
 * Removes CSS overrides from the document root
 */
export function resetCSSOverrides() {
	document.documentElement.style = "";
}

/**
 * Gets the current theme name from the first class on the html element
 */
export function getCurrentTheme() {
	return document.documentElement.classList[0] || null;
}

/**
 * Reads current computed values of CSS variables
 */
export function readCSSVariables(variableNames: string[]) {
	const computed = getComputedStyle(document.documentElement);
	const values: Record<string, string> = {};

	variableNames.forEach((name) => {
		values[name] = computed.getPropertyValue(name).trim();
	});

	return values;
}

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return function (this: any, ...args: Parameters<T>) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}
