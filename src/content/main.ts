import {
	applyCSSVariable,
	getCurrentTheme,
	readCSSVariables,
	resetCSSOverrides,
} from "@/lib/dom-utils";
import { SendMessage } from "@/lib/messaging";
import {
	applyThemePreset,
	handleThemeSwitch,
	watchThemeChanges,
} from "@/lib/theme-manager";
import { type Message, MessageType } from "@/types";

console.log("Content Script: Loaded", new Date(Date.now()).toISOString());

// Initialize: Apply saved overrides for current theme on page load
const initialTheme = getCurrentTheme();
if (initialTheme) {
	applyThemePreset(initialTheme);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg: Message, _, sendResponse) => {
	if (msg.type === MessageType.UPDATE_VAR) {
		applyCSSVariable(msg.varName, msg.value);
		SendMessage.updateBadge(true);
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
		resetCSSOverrides();
		SendMessage.updateBadge(false);
		sendResponse({ status: "OK" });
	}

	return true; // Keep message channel open for async response
});

// Watch for theme changes and handle accordingly
watchThemeChanges((newTheme) => {
	handleThemeSwitch(newTheme);
});
