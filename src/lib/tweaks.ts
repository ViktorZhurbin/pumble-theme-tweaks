import type { ThemeTweaks } from "@/types";

/**
 * Checks if tweaks exist for a theme (has CSS properties saved)
 */
const hasTweaks = (
	tweaks: ThemeTweaks[string] | undefined,
): tweaks is ThemeTweaks[string] => {
	return !!tweaks && Object.keys(tweaks.cssProperties).length > 0;
};

/**
 * Determines if tweaks should be applied (exist and not disabled)
 */
const shouldApplyTweaks = (
	tweaks: ThemeTweaks[string] | undefined,
): boolean => {
	return hasTweaks(tweaks) && !tweaks?.disabled;
};

export const TweakUtils = {
	hasTweaks,
	shouldApplyTweaks,
};
