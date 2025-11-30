import { logger } from "@/lib/logger";
import { Background } from "../background/messenger";
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

		if (newTheme !== currentTheme) {
			const oldTheme = currentTheme;
			currentTheme = newTheme;

			logger.info("Theme changed", { from: oldTheme, to: newTheme });
			// DomUtils.resetCSSTweaks(); // Not needed with diff-based application

			if (newTheme) {
				ThemeState.applyForTheme(newTheme);
			} else {
				// No theme detected - ensure badge is inactive
				Background.sendMessage("updateBadge", { badgeState: "DEFAULT" });
			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return observer;
};
