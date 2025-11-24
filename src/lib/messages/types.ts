import type { ThemeTweaks } from "@/types";

/**
 * Runtime state structure maintained by content script
 * This is the single source of truth for theme tweaks state
 */
export interface RuntimeState {
	themeName: string | null;
	tweakModeOn: boolean;
	pickerValues: Record<string, string>;
	tweaks: ThemeTweaks | undefined;
	globalDisabled: boolean; // Master switch for entire extension
}
