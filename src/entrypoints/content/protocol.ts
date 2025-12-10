import type { RuntimeState } from "@/types/runtime";
import type { StoredCssProperties, StoredPresets } from "@/types/storage";

/**
 * Messages that can be sent TO content scripts
 * (from popup or background)
 */
export interface ContentScriptProtocol {
	// State
	getCurrentState(): RuntimeState;
	setTweaksOn(data: { enabled: boolean }): void;

	// Preset-based messages
	updateWorkingProperty(data: { propertyName: string; value: string }): void;
	toggleWorkingProperty(data: { propertyName: string; enabled: boolean }): void;
	resetWorkingTweaks(): void;
	loadPreset(data: { presetName: string }): void;
	importPreset(data: { cssProperties: StoredCssProperties }): void;
	savePreset(): void;
	savePresetAs(data: { presetName: string }): void;
	deletePreset(data: { presetName: string }): void;
	renamePreset(data: { oldName: string; newName: string }): void;
	getAllPresets(): StoredPresets;
}
