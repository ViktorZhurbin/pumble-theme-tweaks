import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { ToBackground } from "@/lib/messages/to-background";
import { type Message, MessageType } from "@/lib/messages/types";
import { ThemeManager } from "@/lib/theme-manager";
import { ThemeState } from "./theme-state";

logger.info("Content script loaded", { timestamp: new Date().toISOString() });

// Initialize: Apply saved tweaks for current theme on page load
const initializeTheme = () => {
	const initialTheme = DomUtils.getCurrentTheme();
	if (initialTheme) {
		logger.debug("Checking for saved tweaks for initial theme", {
			theme: initialTheme,
		});
		ThemeState.applyForTheme(initialTheme);
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
	// Messages that need responses - return true
	if (msg.type === MessageType.GET_STATE) {
		const state = ThemeState.getCurrentState();
		logger.debug("Getting current state", { state });
		sendResponse(state);
		return true;
	}

	// Fire-and-forget messages - no return needed
	if (msg.type === MessageType.UPDATE_PROPERTY) {
		logger.debug("Updating CSS property via ThemeState", {
			propertyName: msg.propertyName,
			value: msg.value,
		});
		ThemeState.updateProperty(msg.propertyName, msg.value);
	}

	if (msg.type === MessageType.TOGGLE_TWEAKS) {
		logger.debug("Toggling tweaks", { enabled: msg.enabled });
		ThemeState.toggle(msg.enabled);
	}

	if (msg.type === MessageType.RESET_TWEAKS) {
		logger.debug("Resetting tweaks via ThemeState");
		ThemeState.reset();
	}
});

// Watch for theme changes and handle accordingly
const themeObserver = ThemeManager.watchThemeChanges((newTheme, oldTheme) => {
	logger.info("Theme changed", { from: oldTheme, to: newTheme });
	DomUtils.resetCSSTweaks();

	if (newTheme) {
		ThemeState.applyForTheme(newTheme);
	} else {
		// No theme detected - ensure badge is inactive
		ToBackground.updateBadge(false);
	}
});

// Listen for storage changes and re-apply tweaks
chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === "sync" && changes.theme_tweaks) {
		logger.debug("Storage changed, re-applying tweaks");
		const currentTheme = DomUtils.getCurrentTheme();
		if (currentTheme) {
			ThemeState.applyForTheme(currentTheme);
		}
	}
});

// Cleanup: disconnect observer when page hides (more reliable than unload)
window.addEventListener("pagehide", () => {
	logger.debug("Page hiding, disconnecting observer");
	themeObserver.disconnect();
});
