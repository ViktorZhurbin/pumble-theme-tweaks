import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { ThemeManager } from "@/lib/theme-manager";
import { type Message, MessageType } from "@/types";

logger.info("Content script loaded", { timestamp: new Date().toISOString() });

// Initialize: Apply saved overrides for current theme on page load
function initializeTheme() {
	const initialTheme = DomUtils.getCurrentTheme();
	if (initialTheme) {
		logger.debug("Applying saved overrides for initial theme", {
			theme: initialTheme,
		});
		ThemeManager.applyOverridesAndUpdateBadge(initialTheme);
	}
}

// Wait for DOM to be ready before initializing
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeTheme);
} else {
	initializeTheme();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg: Message, _, sendResponse) => {
	if (msg.type === MessageType.UPDATE_VAR) {
		logger.debug("Applying CSS variable", {
			varName: msg.varName,
			value: msg.value,
		});
		DomUtils.applyCSSVariable(msg.varName, msg.value);
		SendMessage.updateBadge(true);
	}

	if (msg.type === MessageType.READ_VARS) {
		const currentValues = DomUtils.getCSSVariables();
		logger.debug("Reading CSS variables", {
			count: Object.keys(currentValues).length,
		});
		sendResponse(currentValues);
	}

	if (msg.type === MessageType.GET_THEME) {
		const theme = DomUtils.getCurrentTheme();
		logger.debug("Getting current theme", { theme });
		sendResponse({ theme });
	}

	if (msg.type === MessageType.RESET_VARS) {
		logger.debug("Resetting CSS overrides");
		DomUtils.resetCSSOverrides();
		SendMessage.updateBadge(false);
	}

	return true; // Keep message channel open for async response
});

// Watch for theme changes and handle accordingly
const themeObserver = ThemeManager.watchThemeChanges((newTheme, oldTheme) => {
	logger.info("Theme changed", { from: oldTheme, to: newTheme });
	DomUtils.resetCSSOverrides();

	if (newTheme) {
		ThemeManager.applyOverridesAndUpdateBadge(newTheme);
	}
});

// Cleanup: disconnect observer when page unloads
window.addEventListener("unload", () => {
	themeObserver.disconnect();
});
