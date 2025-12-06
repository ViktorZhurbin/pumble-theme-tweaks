import type { PresetData, WorkingTweaks } from "./tweaks";

/**
 * Runtime state structure maintained by content script
 * This is the single source of truth for theme tweaks state
 */
export interface RuntimeState {
	themeName: string | null; // Pumble theme (for display only)
	tweaksOn: boolean; // Are tweaks enabled?
	workingTweaks: WorkingTweaks; // Current working state (may have unsaved changes)
	selectedPreset: string | null; // Selected preset name (null = no preset selected)
	savedPresets: Record<string, PresetData>; // All saved presets (for UI dropdown)
	hasUnsavedChanges: boolean; // workingTweaks differs from savedPresets[selectedPreset]?
}
