import type { StoredPreset } from "./storage";
import type { WorkingTweaks } from "./tweaks";

/**
 * Runtime state structure maintained by content script
 * This is the single source of truth for theme tweaks state
 */
export interface RuntimeState {
	tweaksOn: boolean; // Are tweaks enabled?
	workingTweaks: WorkingTweaks; // Current working state (may have unsaved changes)
	selectedPreset: string | null; // Selected preset name (null = no preset selected)
	savedPresets: Record<string, StoredPreset>; // All saved presets (for UI dropdown)
	hasUnsavedChanges: boolean; // workingTweaks differs from savedPresets[selectedPreset]?
}
