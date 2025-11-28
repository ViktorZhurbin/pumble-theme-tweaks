import { PROPERTY_NAMES } from "@/constants/properties";
import { DomUtils } from "./dom-utils";
import { logger } from "@/lib/logger";
import type { RuntimeState } from "@/types/runtime";
import { Storage } from "@/lib/storage";
import { Background } from "../background/messenger";

const initialState: RuntimeState = {
	themeName: null,
	tweakModeOn: true,
	pickerValues: {},
	tweaks: undefined,
	modifiedProperties: [],
	globalDisabled: false,
};
/**
 * ThemeState - Single source of truth for theme tweaks state
 * Manages runtime state, applies CSS changes, and broadcasts updates
 */
class ThemeStateManager {
	private currentState: RuntimeState = initialState;
	private tabId: number | undefined = undefined;

	/**
	 * Initializes the tab ID by requesting it from the background script
	 */
	async initialize() {
		if (this.tabId === undefined) {
			this.tabId = await Background.sendMessage("getTabId", undefined);

			logger.debug("ThemeState: Initialized with tab ID", {
				tabId: this.tabId,
			});
		}
	}

	/**
	 * Returns the current tab ID
	 */
	getTabId(): number | undefined {
		return this.tabId;
	}

	/**
	 * Applies tweaks for a theme and broadcasts state changes
	 * This is the core method that updates DOM, badge, and notifies listeners
	 */
	async applyForTheme(themeName: string) {
		logger.debug("ThemeState: Applying for theme", { themeName });

		// Check global disable first
		const globalDisabled = await Storage.getGlobalDisabled();

		// Load tweaks from storage
		const storedTweaks = await Storage.getTweaks(themeName);

		// Always start fresh - clear all tweaks to ensure DOM matches storage exactly
		DomUtils.resetCSSTweaks();

		// Apply or remove tweaks based on global disable and per-theme settings
		if (!globalDisabled && storedTweaks && !storedTweaks.disabled) {
			logger.debug("ThemeState: Applying CSS tweaks", {
				count: Object.keys(storedTweaks.cssProperties).length,
			});

			// Apply only properties from storage
			for (const [key, value] of Object.entries(storedTweaks.cssProperties)) {
				DomUtils.applyCSSProperty(key, value);
			}

			Background.sendMessage("updateBadge", { badgeState: "ON" });
		} else {
			logger.debug("ThemeState: No tweaks to apply", { globalDisabled });

			// Show "OFF" badge when globally disabled, otherwise no badge
			const badgeState = globalDisabled ? "OFF" : "DEFAULT";
			Background.sendMessage("updateBadge", { badgeState });
		}

		// Update internal state - tweakModeOn represents whether tweaking mode is enabled
		this.currentState = {
			themeName,
			tweakModeOn: !globalDisabled && !storedTweaks?.disabled,
			pickerValues: this.buildPickerValues(storedTweaks),
			tweaks: storedTweaks,
			modifiedProperties: this.getModifiedProperties(),
			globalDisabled,
		};

		// Broadcast state change to popup
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
		});

		logger.debug("ThemeState: State updated", this.currentState);
	}

	/**
	 * Toggles tweaks on/off for current theme
	 */
	async toggle(enabled: boolean) {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot toggle, no theme set");
			return;
		}

		logger.info("ThemeState: Toggling tweaks", { enabled, themeName });

		// Update disabled flag (inverse of enabled)
		await Storage.setDisabled(themeName, !enabled, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Toggles global disable on/off (affects all themes)
	 */
	async toggleGlobal(disabled: boolean) {
		logger.info("ThemeState: Toggling global disable", { disabled });

		// Update global disabled state
		await Storage.setGlobalDisabled(disabled, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Resets all tweaks for current theme
	 */
	async reset() {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot reset, no theme set");
			return;
		}

		logger.info("ThemeState: Resetting tweaks", { themeName });

		// Delete tweaks from storage
		await Storage.deleteTweaks(themeName, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Resets a single CSS property for current theme
	 */
	async resetProperty(propertyName: string) {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot reset property, no theme set");
			return;
		}

		logger.info("ThemeState: Resetting property", { themeName, propertyName });

		// Delete property from storage
		await Storage.deleteProperty(themeName, propertyName, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Updates a single CSS property for current theme
	 */
	updateProperty(propertyName: string, value: string) {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot update property, no theme set");
			return;
		}

		logger.debug("ThemeState: Updating property", {
			themeName,
			propertyName,
			value,
		});

		// Apply to DOM immediately for instant feedback
		DomUtils.applyCSSProperty(propertyName, value);

		// Update internal state immediately
		this.currentState.pickerValues[propertyName] = value;
		if (this.currentState.tweaks) {
			this.currentState.tweaks.cssProperties[propertyName] = value;
		}
		this.currentState.modifiedProperties = this.getModifiedProperties();

		// Update badge to show tweaks are active
		Background.sendMessage("updateBadge", { badgeState: "ON" });

		// Broadcast updated state to popup immediately
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
		});

		// Save to storage in background (debounced)
		Storage.savePropertyDebounced(themeName, propertyName, value, this.tabId);
	}

	/**
	 * Returns current runtime state snapshot
	 */
	getCurrentState(): RuntimeState {
		return { ...this.currentState };
	}

	/**
	 * Builds picker values from tweaks and current DOM state
	 */
	private buildPickerValues(
		tweaks: RuntimeState["tweaks"],
	): Record<string, string> {
		const currentValues = DomUtils.getCSSProperties();

		return PROPERTY_NAMES.reduce<Record<string, string>>(
			(acc, propertyName) => {
				// Prefer saved tweaks, fall back to current DOM values
				const value =
					tweaks?.cssProperties[propertyName] || currentValues[propertyName];

				if (value) {
					acc[propertyName] = value;
				}

				return acc;
			},
			{},
		);
	}

	/**
	 * Gets list of properties that have been modified (exist as inline styles)
	 */
	private getModifiedProperties(): string[] {
		return PROPERTY_NAMES.filter((propertyName) =>
			DomUtils.isPropertyModified(propertyName),
		);
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
