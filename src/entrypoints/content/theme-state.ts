import { BASE_PROPERTY_NAMES, PROPERTIES } from "@/constants/properties";
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

		// Clear DOM first
		DomUtils.resetCSSTweaks();

		// Build working tweaks with initial values from DOM
		const workingTweaks = this.buildWorkingTweaksWithInitialValues(
			storedWorkingTweaks.cssProperties,
		);

		if (tweaksOn) {
			// Apply to DOM
			for (const [key, prop] of Object.entries(workingTweaks.cssProperties)) {
				if (prop.enabled && prop.value !== null) {
					DomUtils.applyCSSProperty(key, prop.value);
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

		const derivedColors = ColorDerivation.computeDerivedColorsFromBase(
			propertyName,
			value,
		);

		// Apply all colors (base + derived) to DOM for immediate visual feedback
		DomUtils.applyManyCSSProperties({
			[propertyName]: value,
			...derivedColors,
		});

		// Save only base property to working storage (derived computed when needed)
		Storage.saveWorkingPropertyDebounced(propertyName, value);
	}

	/**
	 * Toggles a working property's enabled state
	 * Also toggles all derived colors for the property
	 */
	toggleWorkingProperty(propertyName: string, enabled: boolean) {
		logger.debug("ThemeState: Toggling working property", {
			propertyName,
			enabled,
		});

		const cssProperties = this.buildStoredCssProperties();

		// Toggle base property
		if (cssProperties[propertyName]) {
			cssProperties[propertyName].enabled = enabled;
		}

		// Toggle all derived properties
		const derivedProps =
			ColorDerivation.getDerivedPropertyNamesForBase(propertyName);

		for (const derivedProp of derivedProps) {
			if (cssProperties[derivedProp] && derivedProp !== propertyName) {
				cssProperties[derivedProp].enabled = enabled;
			}
		}

		Storage.setWorkingTweaks(cssProperties);
	}

	/**
	 * Converts working tweaks to stored format (without initialValue)
	 * Recomputes all derived colors from base properties to ensure consistency
	 */
	private buildStoredCssProperties(): StoredCssProperties {
		const cssProperties: StoredCssProperties = {};

		for (const base of PROPERTIES) {
			const entry =
				this.currentState.workingTweaks.cssProperties[base.propertyName];

			const baseValue = entry?.value ?? entry?.initialValue;

			// Save base property
			cssProperties[base.propertyName] = {
				value: baseValue,
				enabled: entry?.enabled ?? true,
			};

			// Compute and save derived properties
			const derivedColors = ColorDerivation.computeDerivedColorsFromBase(
				base.propertyName,
				baseValue,
			);

			for (const [derivedProp, derivedValue] of Object.entries(derivedColors)) {
				cssProperties[derivedProp] = {
					value: derivedValue,
					enabled: entry?.enabled ?? true,
				};
			}
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

		// Add base properties
		for (const basePropertyName of BASE_PROPERTY_NAMES) {
			const stored = storedProps[basePropertyName];
			const value = stored?.value ?? null;
			const initialValue = currentDOMValues[basePropertyName] ?? value ?? "";

			cssProperties[basePropertyName] = {
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

		// Check if all properties match
		for (const key of BASE_PROPERTY_NAMES) {
			const workingEntry = workingProps[key];
			const presetEntry = presetProps[key];

			const workingEntryValue =
				workingEntry?.value ?? workingEntry.initialValue;

			// Different value
			if (workingEntryValue !== presetEntry?.value) return true;

			// Different enabled state
			if (workingEntry?.enabled !== presetEntry?.enabled) return true;
		}

		return false;
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
