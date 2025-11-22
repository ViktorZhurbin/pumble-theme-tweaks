import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";

/**
 * Applies CSS property tweaks and updates badge accordingly
 * Respects the disabled flag - won't apply if disabled is true
 */
const applyTweaksAndUpdateBadge = async (
	themeName: string,
): Promise<void> => {
	const tweaks = await Storage.getTweaks(themeName);
	const hasTweaks = !!tweaks && Object.keys(tweaks.cssProperties).length > 0;
	const shouldApply = hasTweaks && !tweaks.disabled;

	if (shouldApply) {
		logger.debug("Applying theme tweaks", {
			theme: themeName,
			count: Object.keys(tweaks.cssProperties).length,
		});
		for (const [key, value] of Object.entries(tweaks.cssProperties)) {
			DomUtils.applyCSSProperty(key, value);
		}
	} else if (hasTweaks && tweaks.disabled) {
		logger.debug("Tweaks exist but are disabled", { theme: themeName });
	} else {
		logger.debug("No tweaks found for theme", { theme: themeName });
	}

	SendMessage.updateBadge(shouldApply);
};

/**
 * Watches for theme changes (class attribute changes on html element)
 */
const watchThemeChanges = (
	onThemeChange: (newTheme: string | null, oldTheme: string | null) => void,
): MutationObserver => {
	let currentTheme = DomUtils.getCurrentTheme();

	const observer = new MutationObserver(() => {
		const newTheme = DomUtils.getCurrentTheme();

		if (newTheme !== currentTheme) {
			const oldTheme = currentTheme;
			currentTheme = newTheme;
			onThemeChange(newTheme, oldTheme);
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return observer;
};

export const ThemeManager = {
	applyTweaksAndUpdateBadge,
	watchThemeChanges,
};
