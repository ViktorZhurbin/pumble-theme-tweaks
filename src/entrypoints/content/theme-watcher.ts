import { logger } from "@/lib/logger";
import { DomUtils } from "./dom-utils";
import { ThemeState } from "./theme-state";

/**
 * Watches for theme changes and delegates to ThemeState
 * Returns MutationObserver for cleanup
 */
export const watchThemeChanges = (): MutationObserver => {
	const observer = new MutationObserver(() => {
		const newTheme = DomUtils.getCurrentTheme();

		logger.debug("Theme watcher: Checking theme", { newTheme });

		// Delegate to ThemeState to handle the change
		ThemeState.onThemeChanged(newTheme);
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return observer;
};
