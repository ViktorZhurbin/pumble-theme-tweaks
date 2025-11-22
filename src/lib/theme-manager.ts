import { DomUtils } from "@/lib/dom-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";

/**
 * Applies CSS variable overrides and updates badge accordingly
 * Respects the disabled flag - won't apply if disabled is true
 */
const applyOverridesAndUpdateBadge = async (
	themeName: string,
): Promise<void> => {
	const preset = await Storage.getPreset(themeName);
	const hasTweaks = !!preset && Object.keys(preset.cssProperties).length > 0;
	const shouldApply = hasTweaks && !preset.disabled;

	if (shouldApply) {
		logger.debug("Applying theme overrides", {
			theme: themeName,
			count: Object.keys(preset.cssProperties).length,
		});
		for (const [key, value] of Object.entries(preset.cssProperties)) {
			DomUtils.applyCSSVariable(key, value);
		}
	} else if (hasTweaks && preset.disabled) {
		logger.debug("Overrides exist but are disabled", { theme: themeName });
	} else {
		logger.debug("No overrides found for theme", { theme: themeName });
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
	applyOverridesAndUpdateBadge,
	watchThemeChanges,
};
