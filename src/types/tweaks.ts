/**
 * Runtime tweak entry (includes computed initialValue from DOM)
 */
export interface TweakEntry {
	value: string | null; // User's custom value (null = not tweaked)
	initialValue: string; // Fresh from DOM on init (NOT stored)
	enabled: boolean;
}

/**
 * Runtime working tweaks (includes computed initialValues)
 * Current state that may have unsaved changes
 */
export interface WorkingTweaks {
	cssProperties: Record<string, TweakEntry>;
}
