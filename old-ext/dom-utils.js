/**
 * Applies a CSS variable to the document root with !important
 * @param {string} name - CSS variable name
 * @param {string} value - CSS variable value
 */
export function applyCSSVariable(name, value) {
	document.documentElement.style.setProperty(name, value, 'important');
}

/**
 * Removes a CSS variable from the document root
 * @param {string} name - CSS variable name
 */
export function removeCSSVariable(name) {
	document.documentElement.style.removeProperty(name);
}

/**
 * Gets the current theme name from the first class on the html element
 * @returns {string | null}
 */
export function getCurrentTheme() {
	return document.documentElement.classList[0] || null;
}

/**
 * Reads current computed values of CSS variables
 * @param {string[]} variableNames
 * @returns {Object.<string, string>}
 */
export function readCSSVariables(variableNames) {
	const computed = getComputedStyle(document.documentElement);
	const values = {};
	
	variableNames.forEach((name) => {
		values[name] = computed.getPropertyValue(name).trim();
	});
	
	return values;
}

/**
 * Creates a debounced function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}
