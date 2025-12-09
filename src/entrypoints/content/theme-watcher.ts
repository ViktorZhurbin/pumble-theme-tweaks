import { logger } from "@/lib/logger";
import { DomUtils } from "./dom-utils";
import { ThemeState } from "./theme-state";

/**
 * Watches for theme changes and handles theme tweak application
 * Returns MutationObserver for cleanup
 */
export const watchThemeChanges = (): MutationObserver => {
	let currentTheme = DomUtils.getCurrentTheme();

	const observer = new MutationObserver(() => {
		const newTheme = DomUtils.getCurrentTheme();

		if (currentTheme && newTheme !== currentTheme) {
			const oldTheme = currentTheme;
			currentTheme = newTheme;

			logger.info("Theme changed", { from: oldTheme, to: newTheme });

			if (newTheme) {
				// Auto-disable tweaks so user can see the actual Pumble theme
				ThemeState.setTweaksOn(false);
			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return observer;
};
