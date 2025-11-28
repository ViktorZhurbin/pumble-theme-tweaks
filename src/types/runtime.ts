import type { ThemeTweaks } from "./tweaks";

/**
 * Runtime state structure maintained by content script
 * This is the single source of truth for theme tweaks state
 */
export interface RuntimeState {
	themeName: string | null;
	themeTweaksOn: boolean;
	themeTweaks: ThemeTweaks | undefined;
	isExtensionOff: boolean; // Master switch for entire extension
}
