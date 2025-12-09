import { PROPERTY_NAMES } from "@/constants/properties";
import { logger } from "@/lib/logger";
import { Storage } from "@/lib/storage";
import type { RuntimeState } from "@/types/runtime";
import type { StoredPreset, StoredTweakEntry } from "@/types/storage";
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
	 * Returns current runtime state snapshot
	 */
	getCurrentState(): RuntimeState {
		return { ...this.currentState };
	}

	/**
	 * Initializes the preset-based system
	 * Loads working tweaks, presets, and applies to DOM
	 */
	async initializePresetSystem() {
		logger.debug("ThemeState: Initializing preset system");

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

		if (!tweaksOn) {
			Background.sendMessage("updateBadge", { badgeState: "OFF" });
		} else if (tweaksOn && !selectedPreset && !hasUnsavedChanges) {
			Background.sendMessage("updateBadge", { badgeState: "DEFAULT" });
		} else {
			Background.sendMessage("updateBadge", { badgeState: "ON" });
		}

		// Update state
		this.currentState = {
			tweaksOn,
			workingTweaks,
			selectedPreset,
			savedPresets,
			hasUnsavedChanges,
		};

		// Broadcast
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
		});

		logger.debug("ThemeState: Preset system initialized", this.currentState);
	}

	/**
	 * Reloads working state from storage and re-applies
	 * Called when storage changes (multi-tab sync)
	 */
	async reloadWorkingState() {
		logger.debug("ThemeState: Reloading working state");

		const tweaksOn = await Storage.getTweaksOn();
		const storedWorkingTweaks = await Storage.getWorkingTweaks();
		const selectedPreset = await Storage.getSelectedPreset();
		const savedPresets = await Storage.getAllPresets();

		// Clear DOM first
		DomUtils.resetCSSTweaks();

		// Build working tweaks with initial values
		const workingTweaks = this.buildWorkingTweaksWithInitialValues(
			storedWorkingTweaks.cssProperties,
		);

		// Compute unsaved changes
		const hasUnsavedChanges = this.computeUnsavedChanges(
			workingTweaks,
			selectedPreset,
			savedPresets,
		);

		if (tweaksOn) {
			// Apply to DOM
			for (const [key, prop] of Object.entries(workingTweaks.cssProperties)) {
				if (prop.enabled && prop.value !== null) {
					DomUtils.applyCSSProperty(key, prop.value);
				}
			}
		}

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

		// Broadcast
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
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
		await Storage.setWorkingTweaks(preset.cssProperties, this.tabId);
		await Storage.setSelectedPreset(presetName, this.tabId);
	}

	/**
	 * Loads a preset into working state
	 */
	async importPreset(cssProperties: StoredPreset["cssProperties"]) {
		logger.info("ThemeState: Importing preset");

		// Set imported preset values as working tweaks
		await Storage.setWorkingTweaks(cssProperties, this.tabId);
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

		await Storage.updatePreset(
			this.currentState.selectedPreset,
			cssProperties,
			this.tabId,
		);
	}

	/**
	 * Saves working state as a new preset
	 */
	async savePresetAs(presetName: string) {
		logger.info("ThemeState: Saving preset as", { presetName });

		const cssProperties = this.buildStoredCssProperties();

		await Storage.createPreset(presetName, cssProperties, this.tabId);
		await Storage.setSelectedPreset(presetName, this.tabId);
	}

	/**
	 * Deletes a preset
	 */
	async deletePreset(presetName: string) {
		logger.info("ThemeState: Deleting preset", { presetName });

		await Storage.deletePreset(presetName, this.tabId);

		// If deleted preset was selected, deselect
		if (this.currentState.selectedPreset === presetName) {
			await Storage.setSelectedPreset(null, this.tabId);
		}
	}

	/**
	 * Toggles tweaks on/off
	 */
	async setTweaksOn(enabled: boolean) {
		logger.info("ThemeState: Toggling tweaks", { enabled });

		// Update tweaks enabled state
		await Storage.setTweaksOn(enabled, this.tabId);
	}

	/**
	 * Resets working tweaks and deselects preset
	 */
	async resetWorkingTweaks() {
		logger.info("ThemeState: Resetting working tweaks");

		// Clear working tweaks from storage
		await Storage.clearWorkingTweaks(this.tabId);

		// Deselect preset
		await Storage.setSelectedPreset(null, this.tabId);
	}

	/**
	 * Updates a single CSS property in working state
	 */
	updateWorkingProperty(propertyName: string, value: string) {
		logger.debug("ThemeState: Updating working property", {
			propertyName,
			value,
		});

		// Apply to DOM immediately for instant feedback
		DomUtils.applyCSSProperty(propertyName, value);

		// Save to storage in background (debounced)
		Storage.saveWorkingPropertyDebounced(propertyName, value, this.tabId);
	}

	/**
	 * Toggles a working property's enabled state
	 */
	toggleWorkingProperty(propertyName: string, enabled: boolean) {
		logger.debug("ThemeState: Toggling working property", {
			propertyName,
			enabled,
		});

		const cssProperties = this.buildStoredCssProperties();

		if (cssProperties[propertyName]) {
			cssProperties[propertyName].enabled = enabled;
		}

		Storage.setWorkingTweaks(cssProperties, this.tabId);
	}

	/**
	 * Converts working tweaks to stored format (without initialValue)
	 */
	private buildStoredCssProperties(): Record<string, StoredTweakEntry> {
		const cssProperties: Record<string, StoredTweakEntry> = {};
		for (const [key, entry] of Object.entries(
			this.currentState.workingTweaks.cssProperties,
		)) {
			cssProperties[key] = {
				value: entry.value ?? entry.initialValue,
				enabled: entry.enabled,
			};
		}
		return cssProperties;
	}

	/**
	 * Computes whether working state differs from selected preset
	 */
	private computeUnsavedChanges(
		workingTweaks: WorkingTweaks,
		selectedPreset: string | null,
		savedPresets: Record<string, StoredPreset>,
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
		for (const key of PROPERTY_NAMES) {
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

	/**
	 * Builds working tweaks with initial values from DOM
	 */
	private buildWorkingTweaksWithInitialValues(
		storedProps: Record<string, StoredTweakEntry>,
	): WorkingTweaks {
		const currentDOMValues = DomUtils.getCSSProperties();

		const cssProperties: Record<string, TweakEntry> = {};

		for (const propertyName of PROPERTY_NAMES) {
			const stored = storedProps[propertyName];
			const value = stored?.value ?? null;
			const initialValue = currentDOMValues[propertyName] ?? value ?? "";

			cssProperties[propertyName] = {
				value,
				initialValue,
				enabled: stored?.enabled ?? true,
			};
		}

		return { cssProperties };
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
