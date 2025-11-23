import { PROPERTY_NAMES } from "@/constants/properties";
import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { ToBackground } from "@/lib/messages/to-background";
import type { RuntimeState } from "@/lib/messages/types";
import { Storage } from "@/lib/storage";

const initialState: RuntimeState = {
	themeName: null,
	tweakModeOn: false,
	pickerValues: {},
	tweaks: undefined,
};
/**
 * ThemeState - Single source of truth for theme tweaks state
 * Manages runtime state, applies CSS changes, and broadcasts updates
 */
class ThemeStateManager {
	private currentState: RuntimeState = initialState;

	/**
	 * Applies tweaks for a theme and broadcasts state changes
	 * This is the core method that updates DOM, badge, and notifies listeners
	 */
	async applyForTheme(themeName: string) {
		logger.debug("ThemeState: Applying for theme", { themeName });

		// Load tweaks from storage
		const storedTweaks = await Storage.getTweaks(themeName);

		// Apply or remove tweaks
		if (storedTweaks && !storedTweaks.disabled) {
			logger.debug("ThemeState: Applying CSS tweaks", {
				count: Object.keys(storedTweaks.cssProperties).length,
			});

			for (const [key, value] of Object.entries(storedTweaks.cssProperties)) {
				DomUtils.applyCSSProperty(key, value);
			}

			ToBackground.updateBadge(true);
		} else {
			logger.debug("ThemeState: Removing CSS tweaks");
			DomUtils.resetCSSTweaks();
			ToBackground.updateBadge(false);
		}

		// Update internal state - tweakModeOn represents whether tweaking mode is enabled
		this.currentState = {
			themeName,
			tweakModeOn: !storedTweaks?.disabled,
			pickerValues: this.buildPickerValues(storedTweaks),
			tweaks: storedTweaks,
		};

		// Broadcast state change to popup
		ToBackground.notifyStateChanged(this.currentState);

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
		await Storage.setDisabled(themeName, !enabled);

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
		await Storage.deleteTweaks(themeName);

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

		// Broadcast updated state to popup immediately
		ToBackground.notifyStateChanged(this.currentState);

		// Save to storage in background (debounced)
		Storage.savePropertyDebounced(themeName, propertyName, value);
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
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
