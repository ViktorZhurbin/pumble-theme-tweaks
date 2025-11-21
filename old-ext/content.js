import { applyCSSVariable, removeCSSVariable, getCurrentTheme, readCSSVariables } from './dom-utils.js';
import { applyThemePreset, handleThemeSwitch, watchThemeChanges } from './theme-manager.js';
import { MessageType, notifyBadgeUpdate } from './messaging.js';

console.log('Content Script: Loaded');

// Initialize: Apply saved overrides for current theme on page load
const initialTheme = getCurrentTheme();
if (initialTheme) {
	applyThemePreset(initialTheme);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === MessageType.UPDATE_VAR) {
		applyCSSVariable(msg.varName, msg.value);
		notifyBadgeUpdate(true);
	}

	if (msg.type === MessageType.READ_VARS) {
		const currentValues = readCSSVariables(msg.vars);
		sendResponse(currentValues);
	}

	if (msg.type === MessageType.GET_THEME) {
		const theme = getCurrentTheme();
		sendResponse({ theme });
	}

	if (msg.type === MessageType.RESET_VARS) {
		console.log('Resetting variables:', msg.vars);
		msg.vars.forEach((name) => {
			removeCSSVariable(name);
		});
		notifyBadgeUpdate(false);
		sendResponse({ status: 'reset_complete' });
	}
});

// Watch for theme changes and handle accordingly
watchThemeChanges((newTheme) => {
	handleThemeSwitch(newTheme);
});
