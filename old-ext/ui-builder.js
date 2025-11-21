import { CSS_VARIABLES } from './config.js';
import { debounce } from './dom-utils.js';
import { saveThemeVariable } from './storage.js';
import { sendUpdateVar } from './messaging.js';

/**
 * @typedef {import('./types.js').CSSVariableConfig} CSSVariableConfig
 */

/**
 * Creates a theme label element
 * @param {string} themeName
 * @returns {HTMLDivElement}
 */
export function createThemeLabel(themeName) {
	const label = document.createElement('div');
	label.style.cssText = 'font-size: 11px; color: #666; margin-bottom: 10px;';
	label.textContent = `Theme: ${themeName}`;
	return label;
}

/**
 * Creates a color picker group element
 * @param {CSSVariableConfig} config
 * @param {string} initialValue
 * @param {number} tabId
 * @param {string} themeName
 * @returns {HTMLDivElement}
 */
export function createPickerGroup(config, initialValue, tabId, themeName) {
	const group = document.createElement('div');
	group.className = 'picker-group';

	const label = document.createElement('label');
	label.textContent = config.label;

	const input = document.createElement('input');
	input.type = 'color';
	input.dataset.name = config.name;
	input.value = initialValue;

	const debouncedSave = debounce(
		(val) => saveThemeVariable(themeName, config.name, val),
		500
	);

	input.addEventListener('input', (e) => {
		const newValue = /** @type {HTMLInputElement} */ (e.target).value;
		sendUpdateVar(tabId, config.name, newValue);
		debouncedSave(newValue);
	});

	group.appendChild(label);
	group.appendChild(input);

	return group;
}

/**
 * Updates all color picker values in the UI
 * @param {HTMLElement} container
 * @param {Object.<string, string>} values - Map of variable name to color value
 */
export function updatePickerValues(container, values) {
	const inputs = container.querySelectorAll('input[type="color"]');
	inputs.forEach((input) => {
		const inputElement = /** @type {HTMLInputElement} */ (input);
		const name = inputElement.dataset.name;
		if (name && values[name]) {
			inputElement.value = values[name];
		}
	});
}

/**
 * Renders all color pickers into the container
 * @param {HTMLElement} container
 * @param {Object.<string, string>} savedSettings
 * @param {Object.<string, string>} liveValues
 * @param {number} tabId
 * @param {string} themeName
 */
export function renderPickers(container, savedSettings, liveValues, tabId, themeName) {
	container.innerHTML = '';
	
	CSS_VARIABLES.forEach((config) => {
		const value = savedSettings[config.name] || liveValues[config.name] || '#000000';
		const group = createPickerGroup(config, value, tabId, themeName);
		container.appendChild(group);
	});
}
