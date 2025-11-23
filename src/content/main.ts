import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { ThemeManager } from "@/lib/theme-manager";
import { type Message, MessageType } from "@/types";

logger.info("Content script loaded", { timestamp: new Date().toISOString() });

// Initialize: Apply saved tweaks for current theme on page load
const initializeTheme = () => {
	const initialTheme = DomUtils.getCurrentTheme();
	if (initialTheme) {
		logger.debug("Applying saved tweaks for initial theme", {
			theme: initialTheme,
		});
		ThemeManager.applyTweaksAndUpdateBadge(initialTheme);
	}
};

// Wait for DOM to be ready before initializing
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeTheme);
} else {
	initializeTheme();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg: Message, _, sendResponse) => {
	if (msg.type === MessageType.UPDATE_PROPERTY) {
		logger.debug("Applying CSS property", {
			propertyName: msg.propertyName,
			value: msg.value,
		});
		DomUtils.applyCSSProperty(msg.propertyName, msg.value);
	}

	if (msg.type === MessageType.READ_PROPERTIES) {
		const currentValues = DomUtils.getCSSProperties();
		logger.debug("Reading CSS properties", {
			count: Object.keys(currentValues).length,
		});
		sendResponse(currentValues);
	}

	if (msg.type === MessageType.GET_THEME) {
		const theme = DomUtils.getCurrentTheme();
		logger.debug("Getting current theme", { theme });
		sendResponse({ theme });
	}

	if (msg.type === MessageType.RESET_PROPERTIES) {
		logger.debug("Resetting CSS tweaks");
		DomUtils.resetCSSTweaks();
	}

	return true; // Keep message channel open for async response
});

// Watch for theme changes and handle accordingly
const themeObserver = ThemeManager.watchThemeChanges((newTheme, oldTheme) => {
	logger.info("Theme changed", { from: oldTheme, to: newTheme });
	DomUtils.resetCSSTweaks();

	if (newTheme) {
		ThemeManager.applyTweaksAndUpdateBadge(newTheme);
	} else {
		// No theme detected - ensure badge is inactive
		SendMessage.updateBadge(false);
	}

	// Notify popup about theme change
	chrome.runtime.sendMessage({
		type: MessageType.THEME_CHANGED,
		newTheme,
		oldTheme,
	});
});

// Cleanup: disconnect observer when page hides (more reliable than unload)
window.addEventListener("pagehide", () => {
	logger.debug("Page hiding, disconnecting observer");
	themeObserver.disconnect();
});
