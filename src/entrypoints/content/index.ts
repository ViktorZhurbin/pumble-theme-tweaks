import { type Browser, browser } from "wxt/browser";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { defineContentScript } from "wxt/utils/define-content-script";
import { logger } from "@/lib/logger";
import { Storage } from "@/lib/storage";
import { ContentScript } from "./messenger";
import { ThemeState } from "./theme-state";
import { watchThemeChanges } from "./theme-watcher";

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

		// Watch for theme changes and handle accordingly
		let themeObserver: MutationObserver;

		// Initialize: Apply saved tweaks on page load
		const initializeTheme = async () => {
			await ThemeState.initializeTabId();
			await ThemeState.reloadState();

			themeObserver = watchThemeChanges();
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

		ContentScript.onMessage("setTweaksOn", (message) => {
			logger.debug("Toggling tweaks", {
				enabled: message.data.enabled,
			});
			ThemeState.setTweaksOn(message.data.enabled);
		});

		// Preset-based message handlers
		ContentScript.onMessage("updateWorkingProperty", (message) => {
			logger.debug("Updating working property", {
				propertyName: message.data.propertyName,
				value: message.data.value,
			});
			ThemeState.updateWorkingProperty(
				message.data.propertyName,
				message.data.value,
			);
		});

		ContentScript.onMessage("toggleWorkingProperty", (message) => {
			logger.debug("Toggling working property", {
				propertyName: message.data.propertyName,
				enabled: message.data.enabled,
			});
			ThemeState.toggleWorkingProperty(
				message.data.propertyName,
				message.data.enabled,
			);
		});

		ContentScript.onMessage("resetWorkingTweaks", () => {
			logger.debug("Resetting working tweaks");
			ThemeState.resetWorkingTweaks();
		});

		ContentScript.onMessage("loadPreset", (message) => {
			logger.debug("Loading preset", { presetName: message.data.presetName });
			ThemeState.loadPreset(message.data.presetName);
		});

		ContentScript.onMessage("importPreset", (message) => {
			logger.debug("Importing preset", { preset: message.data.cssProperties });
			ThemeState.importPreset(message.data.cssProperties);
		});

		ContentScript.onMessage("savePreset", () => {
			logger.debug("Saving preset");
			ThemeState.savePreset();
		});

		ContentScript.onMessage("savePresetAs", (message) => {
			logger.debug("Saving preset as", { presetName: message.data.presetName });
			ThemeState.savePresetAs(message.data.presetName);
		});

		ContentScript.onMessage("deletePreset", (message) => {
			logger.debug("Deleting preset", { presetName: message.data.presetName });
			ThemeState.deletePreset(message.data.presetName);
		});

		ContentScript.onMessage("renamePreset", (message) => {
			logger.debug("Renaming preset", {
				oldName: message.data.oldName,
				newName: message.data.newName,
			});
			Storage.renamePreset(
				message.data.oldName,
				message.data.newName,
				ThemeState.getTabId(),
			);
		});

		ContentScript.onMessage("getAllPresets", async () => {
			logger.debug("Getting all presets");
			return await Storage.getAllPresets();
		});

		// Listen for storage changes and re-apply tweaks - use ctx for automatic cleanup
		const storageListener = (
			changes: Record<string, Browser.storage.StorageChange>,
			areaName: Browser.storage.AreaName,
		) => {
			if (areaName !== "sync") return;

			const hasRelevantChanges = Object.keys(changes).some((key) =>
				[
					"working_tweaks",
					"selected_preset",
					"saved_presets",
					"tweaks_on",
				].includes(key),
			);

			if (hasRelevantChanges) {
				logger.debug("Storage changed, re-applying tweaks");
				ThemeState.reloadState();
			}
		};
		browser.storage.onChanged.addListener(storageListener);

		// Cleanup: disconnect observer when page hides - use ctx for automatic cleanup
		ctx.addEventListener(window, "pagehide", () => {
			logger.debug("Page hiding, disconnecting observer");
			themeObserver?.disconnect();
			browser.storage.onChanged.removeListener(storageListener);
		});
	},
});
