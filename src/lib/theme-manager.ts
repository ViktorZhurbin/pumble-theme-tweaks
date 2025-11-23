import { DomUtils } from "@/lib/dom-utils";

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
	watchThemeChanges,
};
