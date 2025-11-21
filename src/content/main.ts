import { PROPERTY_NAMES } from "@/constants/config";
import { DomUtils } from "@/lib/dom-utils";
import { SendMessage } from "@/lib/messaging";
import { ThemeManager } from "@/lib/theme-manager";
import { type Message, MessageType } from "@/types";

console.log("Content Script: Loaded", new Date().toISOString());

// Initialize: Apply saved overrides for current theme on page load
const initialTheme = DomUtils.getCurrentTheme();
if (initialTheme) {
	ThemeManager.applyOverridesAndUpdateBadge(initialTheme);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg: Message, _, sendResponse) => {
	if (msg.type === MessageType.UPDATE_VAR) {
		DomUtils.applyCSSVariable(msg.varName, msg.value);
		SendMessage.updateBadge(true);
	}

	if (msg.type === MessageType.READ_VARS) {
		const currentValues = DomUtils.getCSSVariables(PROPERTY_NAMES);
		sendResponse(currentValues);
	}

	if (msg.type === MessageType.GET_THEME) {
		const theme = DomUtils.getCurrentTheme();
		sendResponse({ theme });
	}

	if (msg.type === MessageType.RESET_VARS) {
		DomUtils.resetCSSOverrides();
		SendMessage.updateBadge(false);
	}

	return true; // Keep message channel open for async response
});

// Watch for theme changes and handle accordingly
const themeObserver = ThemeManager.watchThemeChanges((newTheme) => {
	DomUtils.resetCSSOverrides();

	if (newTheme) {
		ThemeManager.applyOverridesAndUpdateBadge(newTheme);
	}
});

// Cleanup: disconnect observer when page unloads
window.addEventListener("unload", () => {
	themeObserver.disconnect();
});
