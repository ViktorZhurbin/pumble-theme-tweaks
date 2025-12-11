import { PICKER_IDS } from "@/constants/properties";
import { ColorDerivation } from "@/lib/color-derivation";
import { logger } from "@/lib/logger";
import { Storage } from "@/lib/storage";
import type { RuntimeState } from "@/types/runtime";
import type { StoredCssProperties, StoredPresets } from "@/types/storage";
import type { TweakEntry, WorkingTweaks } from "@/types/tweaks";
import { Background } from "../background/messenger";
import { DomUtils } from "./dom-utils";

const initialState: RuntimeState = {
	tweaksOn: true,
	workingTweaks: { cssProperties: {} },
	selectedPreset: null,
	savedPresets: {},
	hasUnsavedChanges: false,
};
/**
 * ThemeState - Single source of truth for theme tweaks state
 * Manages runtime state, applies CSS changes, and broadcasts updates
 */
class ThemeStateManager {
	private currentState: RuntimeState = initialState;

	/**
	 * Returns current runtime state snapshot
	 */
	getCurrentState(): RuntimeState {
		return { ...this.currentState };
	}

	/**
	 * Reloads state from storage and re-applies
	 * Called when storage changes (multi-tab sync)
	 */
	async reloadState() {
		logger.debug("ThemeState: Reloading state");

		// Load state from storage
		const tweaksOn = await Storage.getTweaksOn();
		const storedWorkingTweaks = await Storage.getWorkingTweaks();
		const selectedPreset = await Storage.getSelectedPreset();
		const savedPresets = await Storage.getAllPresets();

		// Build working tweaks with initial values from DOM (BEFORE clearing)
		const workingTweaks = this.buildWorkingTweaksWithInitialValues(
			storedWorkingTweaks.cssProperties,
		);

		// Clear DOM after reading initial values
		DomUtils.resetCSSTweaks();

		if (tweaksOn) {
			// Apply CSS properties to DOM (computed from picker values)
			for (const [pickerId, tweakEntry] of Object.entries(
				workingTweaks.cssProperties,
			)) {
				if (tweakEntry.enabled && tweakEntry.value !== null) {
					// Compute all CSS properties from picker value
					const cssProperties = ColorDerivation.computeCssProperties(
						pickerId,
						tweakEntry.value,
					);

					// Apply all CSS properties
					DomUtils.applyManyCSSProperties(cssProperties);
				}
			}
		}

		// Compute unsaved changes
		const hasUnsavedChanges = this.computeUnsavedChanges(
			workingTweaks,
			selectedPreset,
			savedPresets,
		);

		// update badge
		if (!tweaksOn) {
			Background.sendMessage("updateBadge", { badgeState: "OFF" });
		} else if (tweaksOn && !selectedPreset && !hasUnsavedChanges) {
			Background.sendMessage("updateBadge", { badgeState: "DEFAULT" });
		} else {
			Background.sendMessage("updateBadge", { badgeState: "ON" });
		}

		// Update state
		this.currentState = {
			...this.currentState,
			tweaksOn,
			workingTweaks,
			selectedPreset,
			savedPresets,
			hasUnsavedChanges,
		};

		// Broadcast change to popup
		const tabId = await Background.sendMessage("getTabId", undefined);
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId,
		});
	}

	/**
	 * Loads a preset into working state
	 */
	async loadPreset(presetName: string) {
		const preset = await Storage.getPreset(presetName);

		if (!preset) {
			logger.warn("ThemeState: Preset not found", { presetName });
			return;
		}

		logger.info("ThemeState: Loading preset", { presetName });

		// Set working tweaks to preset values
		await Storage.setWorkingTweaks(preset.cssProperties);
		await Storage.setSelectedPreset(presetName);
	}

	/**
	 * Loads a preset into working state
	 */
	async importPreset(cssProperties: StoredCssProperties) {
		logger.info("ThemeState: Importing preset");

		// Set imported preset values as working tweaks
		await Storage.setWorkingTweaks(cssProperties);
	}

	/**
	 * Saves working state to the currently selected preset
	 */
	async savePreset() {
		if (!this.currentState.selectedPreset) {
			logger.warn("ThemeState: Cannot save, no preset selected");
			return;
		}

		logger.info("ThemeState: Saving preset", {
			presetName: this.currentState.selectedPreset,
		});

		const cssProperties = this.buildStoredCssProperties();

		await Storage.updatePreset(this.currentState.selectedPreset, cssProperties);
	}

	/**
	 * Saves working state as a new preset
	 */
	async savePresetAs(presetName: string) {
		logger.info("ThemeState: Saving preset as", { presetName });

		const cssProperties = this.buildStoredCssProperties();

		await Storage.createPreset(presetName, cssProperties);
		await Storage.setSelectedPreset(presetName);
	}

	/**
	 * Deletes a preset
	 */
	async deletePreset(presetName: string) {
		logger.info("ThemeState: Deleting preset", { presetName });

		await Storage.deletePreset(presetName);

		// If deleted preset was selected, deselect
		if (this.currentState.selectedPreset === presetName) {
			await Storage.setSelectedPreset(null);
		}
	}

	/**
	 * Toggles tweaks on/off
	 */
	async setTweaksOn(enabled: boolean) {
		logger.info("ThemeState: Toggling tweaks", { enabled });

		// Update tweaks enabled state
		await Storage.setTweaksOn(enabled);
	}

	/**
	 * Resets working tweaks and deselects preset
	 */
	async resetWorkingTweaks() {
		logger.info("ThemeState: Resetting working tweaks");

		// Clear working tweaks from storage
		await Storage.clearWorkingTweaks();

		// Deselect preset
		await Storage.setSelectedPreset(null);
	}

	/**
	 * Updates a single CSS property in working state
	 * Applies base + derived colors to DOM, but only saves base to storage
	 */
	updateWorkingProperty(propertyName: string, value: string) {
		logger.debug("ThemeState: Updating working property", {
			propertyName,
			value,
		});

		// Compute all CSS properties from picker value
		const cssProperties = ColorDerivation.computeCssProperties(
			propertyName,
			value,
		);

		// Apply all CSS properties to DOM for immediate visual feedback
		DomUtils.applyManyCSSProperties(cssProperties);

		// Save only base property to working storage (derived computed when needed)
		Storage.saveWorkingPropertyDebounced(propertyName, value);
	}

	/**
	 * Toggles a working property's enabled state
	 * Derived colors are automatically enabled/disabled when applying to DOM
	 */
	toggleWorkingProperty(propertyName: string, enabled: boolean) {
		logger.debug("ThemeState: Toggling working property", {
			propertyName,
			enabled,
		});

		const cssProperties = this.buildStoredCssProperties();

		// Toggle base property (derived colors handled automatically on apply)
		if (cssProperties[propertyName]) {
			cssProperties[propertyName].enabled = enabled;
		}

		Storage.setWorkingTweaks(cssProperties);
	}

	/**
	 * Converts working tweaks to stored format (without initialValue)
	 * Stores ONLY base properties (opaque picker values)
	 * Derived colors are computed on-the-fly when applying to DOM
	 */
	private buildStoredCssProperties(): StoredCssProperties {
		const cssProperties: StoredCssProperties = {};

		for (const pickerId of PICKER_IDS) {
			const tweakEntry =
				this.currentState.workingTweaks.cssProperties[pickerId];

			const pickerValue = tweakEntry?.value ?? tweakEntry?.initialValue;

			// Save only picker value (opaque base color)
			cssProperties[pickerId] = {
				value: pickerValue,
				enabled: tweakEntry?.enabled ?? true,
			};
		}

		return cssProperties;
	}

	/**
	 * Builds working tweaks with initial values from DOM
	 * Stores only base properties; derived colors computed on-demand when needed
	 */
	private buildWorkingTweaksWithInitialValues(
		storedProps: StoredCssProperties,
	): WorkingTweaks {
		const currentDOMValues = DomUtils.getCSSProperties();

		const cssProperties: Record<string, TweakEntry> = {};

		// Add picker controls (storage keys)
		for (const pickerId of PICKER_IDS) {
			const stored = storedProps[pickerId];
			const value = stored?.value ?? null;

			// Preserve existing initialValue to avoid re-reading from modified DOM
			const existingInitialValue =
				this.currentState.workingTweaks?.cssProperties[pickerId]?.initialValue;

			// Only read value from currentDOMValues on first load (when no existingInitialValue)
			const initialValue =
				existingInitialValue ?? currentDOMValues[pickerId] ?? value ?? "";

			cssProperties[pickerId] = {
				value,
				initialValue,
				enabled: stored?.enabled ?? true,
			};
		}

		return { cssProperties };
	}

	/**
	 * Computes whether working state differs from selected preset
	 */
	private computeUnsavedChanges(
		workingTweaks: WorkingTweaks,
		selectedPreset: string | null,
		savedPresets: StoredPresets,
	): boolean {
		// No preset selected, check if user has changed some colors
		if (!selectedPreset || !savedPresets[selectedPreset]) {
			return Object.values(workingTweaks.cssProperties).some(
				(entry) => entry.value !== null && entry.value !== entry.initialValue,
			);
		}

		const preset = savedPresets[selectedPreset];

		// Compare working tweaks to preset
		const workingProps = workingTweaks.cssProperties;
		const presetProps = preset.cssProperties;

		// Check if all picker values match
		for (const pickerId of PICKER_IDS) {
			const tweakEntry = workingProps[pickerId];
			const storedEntry = presetProps[pickerId];

			// When comparing to preset: if working value is null, assume preset value
			// (user hasn't changed it yet, so it matches the preset)
			const workingEntryValue = tweakEntry?.value ?? storedEntry?.value;

			// Different value
			if (workingEntryValue !== storedEntry?.value) return true;

			// Different enabled state
			if (tweakEntry?.enabled !== storedEntry?.enabled) return true;
		}

		return false;
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
