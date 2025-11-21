import { CSS_VARIABLES } from './config.js';
import { getThemePreset, deleteThemePreset } from './storage.js';
import { requestVariableValues, requestThemeName, sendResetVars } from './messaging.js';
import { createThemeLabel, renderPickers, updatePickerValues } from './ui-builder.js';

const container = document.getElementById('pickers-container');
const resetButton = document.getElementById('reset-btn');

/**
 * Gets the active tab
 * @returns {Promise<chrome.tabs.Tab | null>}
 */
async function getActiveTab() {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return tab || null;
}

/**
 * Loads and displays all UI elements with current data
 * @param {number} tabId
 * @param {string} themeName
 * @returns {Promise<void>}
 */
async function loadUI(tabId, themeName) {
	const varNames = CSS_VARIABLES.map((v) => v.name);
	const [savedSettings, liveValues] = await Promise.all([
		getThemePreset(themeName),
		requestVariableValues(tabId, varNames),
	]);

	renderPickers(container, savedSettings, liveValues, tabId, themeName);
}

/**
 * Refreshes picker values without recreating UI
 * @param {number} tabId
 * @param {string} themeName
 * @returns {Promise<void>}
 */
async function refreshUI(tabId, themeName) {
	const varNames = CSS_VARIABLES.map((v) => v.name);
	const [savedSettings, liveValues] = await Promise.all([
		getThemePreset(themeName),
		requestVariableValues(tabId, varNames),
	]);

	const values = {};
	CSS_VARIABLES.forEach((config) => {
		values[config.name] = savedSettings[config.name] || liveValues[config.name] || '#000000';
	});

	updatePickerValues(container, values);
}

/**
 * Handles the reset button click
 * @param {number} tabId
 * @param {string} themeName
 * @returns {Promise<void>}
 */
async function handleReset(tabId, themeName) {
	await deleteThemePreset(themeName);
	
	const varNames = CSS_VARIABLES.map((v) => v.name);
	await sendResetVars(tabId, varNames);
	await refreshUI(tabId, themeName);
}

/**
 * Displays an error message in the UI
 * @param {string} message
 */
function showError(message) {
	container.innerHTML = `<p>${message}</p>`;
}

/**
 * Initializes the popup
 */
async function init() {
	const tab = await getActiveTab();

	if (!tab?.id) {
		showError('Please open a Pumble tab');
		return;
	}

	const currentTheme = await requestThemeName(tab.id);

	if (!currentTheme) {
		showError('Unable to detect Pumble theme');
		return;
	}

	// Add theme indicator
	const themeLabel = createThemeLabel(currentTheme);
	container.parentElement.insertBefore(themeLabel, container);

	// Load initial UI
	await loadUI(tab.id, currentTheme);

	// Setup reset button
	resetButton.addEventListener('click', () => {
		handleReset(tab.id, currentTheme);
	});

	// Listen for external storage changes
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === 'sync' && changes.theme_presets) {
			console.log('Theme presets changed externally. Refreshing UI...');
			refreshUI(tab.id, currentTheme);
		}
	});
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
