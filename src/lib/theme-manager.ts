import { DomUtils } from "./dom-utils";
import { SendMessage } from "./messaging";
import { Storage } from "./storage";

/**
 * Applies CSS variable overrides and updates badge accordingly
 */
const applyOverridesAndUpdateBadge = async (
	themeName: string,
): Promise<void> => {
	const overrides = await Storage.getPreset(themeName);
	const hasOverrides = !!overrides && Object.keys(overrides).length > 0;

	if (hasOverrides) {
		Object.entries(overrides).forEach(([key, value]) => {
			DomUtils.applyCSSVariable(key, value);
		});
	}

	SendMessage.updateBadge(hasOverrides);
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
