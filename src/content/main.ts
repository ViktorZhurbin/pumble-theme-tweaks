import browser from "webextension-polyfill";
import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { ContentScript } from "@/lib/messages";
import { ThemeState } from "./theme-state";
import { watchThemeChanges } from "./theme-watcher";

logger.info("Content script loaded", { timestamp: new Date().toISOString() });

// Initialize: Apply saved tweaks for current theme on page load
const initializeTheme = async () => {
	// Initialize tab ID first
	await ThemeState.initialize();

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
ContentScript.onMessage("getCurrentState", () => {
	const state = ThemeState.getCurrentState();
	logger.debug("Getting current state", { state });
	return state;
});

ContentScript.onMessage("updateProperty", (msg) => {
	logger.debug("Updating CSS property via ThemeState", {
		propertyName: msg.data.propertyName,
		value: msg.data.value,
	});
	ThemeState.updateProperty(msg.data.propertyName, msg.data.value);
});

ContentScript.onMessage("toggleTweaks", (msg) => {
	logger.debug("Toggling tweaks", { enabled: msg.data.enabled });
	ThemeState.toggle(msg.data.enabled);
});

ContentScript.onMessage("resetTweaks", () => {
	logger.debug("Resetting tweaks via ThemeState");
	ThemeState.reset();
});

ContentScript.onMessage("toggleGlobal", (msg) => {
	logger.debug("Toggling global disable", { disabled: msg.data.disabled });
	ThemeState.toggleGlobal(msg.data.disabled);
});

// Watch for theme changes and handle accordingly
const themeObserver = watchThemeChanges();

// Listen for storage changes and re-apply tweaks
browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== "sync") return;

	if (changes.theme_tweaks || changes.global_disabled) {
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
