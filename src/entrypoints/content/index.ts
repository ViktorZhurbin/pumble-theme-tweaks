import { DomUtils } from "./dom-utils";
import { logger } from "@/lib/logger";
import { ContentScript } from "./messenger";
import { ThemeState } from "./theme-state";
import { watchThemeChanges } from "./theme-watcher";
import { defineContentScript } from "wxt/utils/define-content-script";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { Browser, browser } from "wxt/browser";

export default defineContentScript({
	matches: [
		"https://app.pumble.com/*",
		"https://app.stage.ops.pumble.com/*",
		"https://*.fe.pumble-dev.com/*",
	],
	main(ctx: ContentScriptContext) {
		logger.info("Content script loaded", {
			timestamp: new Date().toISOString(),
		});

		// Initialize: Apply saved tweaks for current theme on page load
		const initializeTheme = async () => {
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

		ContentScript.onMessage("updateProperty", (message) => {
			logger.debug("Updating CSS property via ThemeState", {
				propertyName: message.data.propertyName,
				value: message.data.value,
			});
			ThemeState.updateProperty(message.data.propertyName, message.data.value);
		});

		ContentScript.onMessage("toggleTweaks", (message) => {
			logger.debug("Toggling tweaks", { enabled: message.data.enabled });
			ThemeState.toggle(message.data.enabled);
		});

		ContentScript.onMessage("resetTweaks", () => {
			logger.debug("Resetting tweaks via ThemeState");
			ThemeState.reset();
		});

		ContentScript.onMessage("toggleGlobal", (message) => {
			logger.debug("Toggling global disable", {
				disabled: message.data.disabled,
			});
			ThemeState.toggleGlobal(message.data.disabled);
		});

		// Watch for theme changes and handle accordingly
		const themeObserver = watchThemeChanges();

		// Listen for storage changes and re-apply tweaks - use ctx for automatic cleanup
		const storageListener = (
			changes: Record<string, Browser.storage.StorageChange>,
			areaName: Browser.storage.AreaName,
		) => {
			if (areaName !== "sync") return;

			if (changes.theme_tweaks || changes.global_disabled) {
				logger.debug("Storage changed, re-applying tweaks");
				const currentTheme = DomUtils.getCurrentTheme();
				if (currentTheme) {
					ThemeState.applyForTheme(currentTheme);
				}
			}
		};
		browser.storage.onChanged.addListener(storageListener);

		// Cleanup: disconnect observer when page hides - use ctx for automatic cleanup
		ctx.addEventListener(window, "pagehide", () => {
			logger.debug("Page hiding, disconnecting observer");
			themeObserver.disconnect();
			browser.storage.onChanged.removeListener(storageListener);
		});
	},
});
