import { ChromeUtils } from "@/lib/chrome-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";

/**
 * Business logic for ThemeEditor component
 * Handles all theme-related operations
 */
export const ThemeEditorService = {
	/**
	 * Resets all tweaks for a theme
	 * Returns the default values after reset
	 */
	async resetTheme(
		tabId: number,
		themeName: string,
	): Promise<Record<string, string>> {
		logger.info("Resetting theme tweaks", { theme: themeName });
		await Storage.deleteTweaks(themeName);
		await SendMessage.resetProperties(tabId);
		SendMessage.updateBadge(false, tabId);
		const values = await ChromeUtils.getPickerValues(tabId, themeName);
		logger.debug("Theme reset complete");
		return values;
	},

	/**
	 * Updates a single CSS property
	 */
	updateColor(
		tabId: number,
		themeName: string,
		propertyName: string,
		value: string,
	): void {
		SendMessage.updateProperty(tabId, propertyName, value);
		Storage.saveProperty(themeName, propertyName, value);
	},

	/**
	 * Toggles tweaks on/off for a theme
	 */
	async toggleTweaks(
		tabId: number,
		themeName: string,
		enabled: boolean,
		pickerValues: Record<string, string>,
	): Promise<void> {
		// Save disabled state (inverse of enabled)
		await Storage.setDisabled(themeName, !enabled);

		if (enabled) {
			logger.debug("Applying theme tweaks");
			for (const [propertyName, value] of Object.entries(pickerValues)) {
				SendMessage.updateProperty(tabId, propertyName, value);
			}
		} else {
			logger.debug("Removing theme tweaks from document");
			await SendMessage.resetProperties(tabId);
		}

		// Update badge to reflect current state
		SendMessage.updateBadge(enabled, tabId);
	},
};
