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
	 * NEW PRESET-BASED METHODS
	 */

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

		// Apply working tweaks to DOM if enabled
		if (tweaksOn) {
			for (const [key, prop] of Object.entries(workingTweaks.cssProperties)) {
				if (prop.enabled && prop.value !== null) {
					DomUtils.applyCSSProperty(key, prop.value);
				}
			}
			Background.sendMessage("updateBadge", { badgeState: "ON" });
		} else {
			Background.sendMessage("updateBadge", { badgeState: "OFF" });
		}

		// Compute unsaved changes
		const hasUnsavedChanges = this.computeUnsavedChanges(
			workingTweaks,
			selectedPreset,
			savedPresets,
		);

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

		// Apply to DOM
		if (tweaksOn) {
			for (const [key, prop] of Object.entries(workingTweaks.cssProperties)) {
				if (prop.enabled && prop.value !== null) {
					DomUtils.applyCSSProperty(key, prop.value);
				}
			}
			Background.sendMessage("updateBadge", { badgeState: "ON" });
		} else {
			Background.sendMessage("updateBadge", { badgeState: "OFF" });
		}

		// Compute unsaved changes
		const hasUnsavedChanges = this.computeUnsavedChanges(
			workingTweaks,
			selectedPreset,
			savedPresets,
		);

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

		// Re-apply will be triggered by storage.onChanged listener
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

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Saves working state as a new preset
	 */
	async savePresetAs(presetName: string) {
		logger.info("ThemeState: Saving preset as", { presetName });

		const cssProperties = this.buildStoredCssProperties();

		await Storage.createPreset(presetName, cssProperties, this.tabId);
		await Storage.setSelectedPreset(presetName, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
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

		// Re-apply will be triggered by storage.onChanged listener
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
		if (!selectedPreset) return false;

		const preset = savedPresets[selectedPreset];
		if (!preset) return false;

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
			const initialValue = currentDOMValues[propertyName] || "";
			const stored = storedProps[propertyName];

			cssProperties[propertyName] = {
				value: stored?.value ?? null,
				initialValue,
				enabled: stored?.enabled ?? true,
			};
		}

		return { cssProperties };
	}

	/**
	 * Toggles tweaks on/off
	 */
	async setTweaksOn(enabled: boolean) {
		logger.info("ThemeState: Toggling tweaks", { enabled });

		// Update tweaks enabled state
		await Storage.setTweaksOn(enabled, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Resets working tweaks and deselects preset (NEW preset-based)
	 */
	async resetWorkingTweaks() {
		logger.info("ThemeState: Resetting working tweaks");

		// Clear working tweaks from storage
		await Storage.clearWorkingTweaks(this.tabId);

		// Deselect preset
		await Storage.setSelectedPreset(null, this.tabId);

		// Re-apply will be triggered by storage.onChanged listener
	}

	/**
	 * Updates a single CSS property in working state (NEW preset-based)
	 */
	updateWorkingProperty(propertyName: string, value: string) {
		logger.debug("ThemeState: Updating working property", {
			propertyName,
			value,
		});

		// Apply to DOM immediately for instant feedback
		DomUtils.applyCSSProperty(propertyName, value);

		// Update internal state immediately
		const existing =
			this.currentState.workingTweaks.cssProperties[propertyName];
		this.currentState.workingTweaks.cssProperties[propertyName] = {
			value,
			initialValue: existing?.initialValue ?? "",
			enabled: existing?.enabled ?? true,
		};

		// Recompute unsaved changes
		this.currentState.hasUnsavedChanges = this.computeUnsavedChanges(
			this.currentState.workingTweaks,
			this.currentState.selectedPreset,
			this.currentState.savedPresets,
		);

		// Update badge to show tweaks are active
		Background.sendMessage("updateBadge", { badgeState: "ON" });

		// Broadcast updated state to popup immediately
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
		});

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

		const existing =
			this.currentState.workingTweaks.cssProperties[propertyName];
		if (!existing) return;

		// Update enabled state
		this.currentState.workingTweaks.cssProperties[propertyName] = {
			...existing,
			enabled,
		};

		// Apply or remove from DOM based on enabled state
		if (enabled && existing.value !== null) {
			DomUtils.applyCSSProperty(propertyName, existing.value);
		} else {
			DomUtils.removeCSSProperty(propertyName);
		}

		// Recompute unsaved changes
		this.currentState.hasUnsavedChanges = this.computeUnsavedChanges(
			this.currentState.workingTweaks,
			this.currentState.selectedPreset,
			this.currentState.savedPresets,
		);

		// Broadcast updated state to popup
		Background.sendMessage("stateChanged", {
			state: this.currentState,
			tabId: this.tabId,
		});

		// Save to storage
		const cssProperties: Record<string, StoredTweakEntry> = {};
		for (const [key, entry] of Object.entries(
			this.currentState.workingTweaks.cssProperties,
		)) {
			if (entry.value !== null) {
				cssProperties[key] = {
					value: entry.value,
					enabled: entry.enabled,
				};
			}
		}
		Storage.setWorkingTweaks(cssProperties, this.tabId);
	}

	/**
	 * Returns current runtime state snapshot
	 */
	getCurrentState(): RuntimeState {
		return { ...this.currentState };
	}
}

// Export singleton instance
export const ThemeState = new ThemeStateManager();
export { initialState };
