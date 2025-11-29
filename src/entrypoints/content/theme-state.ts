import { PROPERTY_NAMES } from "@/constants/properties";
import { logger } from "@/lib/logger";
import { Storage } from "@/lib/storage";
import type { RuntimeState } from "@/types/runtime";
import type {
	StoredThemeTweaks,
	ThemeTweaks,
	TweakEntry,
} from "@/types/tweaks";
import { Background } from "../background/messenger";
import { DomUtils } from "./dom-utils";

const initialState: RuntimeState = {
	themeName: null,
	themeTweaksOn: true,
	themeTweaks: undefined,
	isExtensionOff: false,
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
		const isExtensionOff = await Storage.getGlobalDisabled();

		// Load tweaks from storage
		const storedThemeTweaks = await Storage.getTweaks(themeName);

		// Always start fresh - clear all tweaks to ensure DOM matches storage exactly
		DomUtils.resetCSSTweaks();

		// Build full tweaks structure with initial values from DOM
		const themeTweaks = this.buildTweaksWithInitialValues(storedThemeTweaks);

		// Apply or remove tweaks based on global disable and per-theme settings
		if (!isExtensionOff && storedThemeTweaks && !storedThemeTweaks.disabled) {
			logger.debug("ThemeState: Applying CSS tweaks", {
				count: Object.keys(storedThemeTweaks.cssProperties).length,
			});

			// Apply only enabled properties with user-set values
			for (const [key, prop] of Object.entries(themeTweaks.cssProperties)) {
				if (prop.enabled && prop.value !== null) {
					DomUtils.applyCSSProperty(key, prop.value);
				}
			}

			Background.sendMessage("updateBadge", { badgeState: "ON" });
		} else {
			logger.debug("ThemeState: No tweaks to apply", { isExtensionOff });

			// Show "OFF" badge when globally disabled, otherwise no badge
			const badgeState = isExtensionOff ? "OFF" : "DEFAULT";
			Background.sendMessage("updateBadge", { badgeState });
		}

		// Update internal state - themeTweaksOn represents whether tweaking mode is enabled
		this.currentState = {
			themeName,
			themeTweaksOn: !isExtensionOff && !storedThemeTweaks?.disabled,
			themeTweaks,
			isExtensionOff,
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
	 * Toggles a specific property on/off
	 */
	async toggleProperty(propertyName: string, enabled: boolean) {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot toggle property, no theme set");
			return;
		}

		logger.info("ThemeState: Toggling property", {
			themeName,
			propertyName,
			enabled,
		});

		// Update storage
		await Storage.setPropertyEnabled(
			themeName,
			propertyName,
			enabled,
			this.tabId,
		);

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
	 * Imports theme tweaks from a properties object (property name → hex color)
	 */
	async importTweaks(properties: Record<string, string>) {
		const themeName = this.currentState.themeName;
		if (!themeName) {
			logger.warn("ThemeState: Cannot import, no theme set");
			return;
		}

		logger.info("ThemeState: Importing tweaks", {
			themeName,
			count: Object.keys(properties).length,
		});

		// Clear all existing tweaks
		await Storage.deleteTweaks(themeName, this.tabId);

		// Import new values (iterate over object keys)
		for (const [propertyName, value] of Object.entries(properties)) {
			// Validate property exists in PROPERTY_NAMES
			if (!PROPERTY_NAMES.includes(propertyName)) {
				logger.warn("ThemeState: Skipping unknown property", { propertyName });
				continue;
			}

			// saveProperty defaults enabled to true
			await Storage.saveProperty(themeName, propertyName, value, this.tabId);
		}

		// Re-apply triggered by storage.onChanged listener
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
		if (this.currentState.themeTweaks) {
			// Update value while preserving enabled state and initialValue
			const existing =
				this.currentState.themeTweaks.cssProperties[propertyName];
			this.currentState.themeTweaks.cssProperties[propertyName] = {
				value,
				initialValue: existing?.initialValue ?? "",
				enabled: existing?.enabled ?? true,
			};
		}

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
	 * Builds tweaks with initial values from DOM
	 */
	private buildTweaksWithInitialValues(
		storedTweaks: StoredThemeTweaks | undefined,
	): ThemeTweaks {
		const currentDOMValues = DomUtils.getCSSProperties();

		const cssProperties: Record<string, TweakEntry> = {};

		for (const propertyName of PROPERTY_NAMES) {
			const initialValue = currentDOMValues[propertyName] || "";
			const stored = storedTweaks?.cssProperties[propertyName];

			cssProperties[propertyName] = {
				value: stored?.value ?? null,
				initialValue,
				enabled: stored?.enabled ?? true,
			};
		}

		return {
			disabled: storedTweaks?.disabled ?? false,
			cssProperties,
		};
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
