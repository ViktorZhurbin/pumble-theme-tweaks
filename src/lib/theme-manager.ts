import {
	applyCSSVariable,
	getCurrentTheme,
	resetCSSOverrides,
} from "./dom-utils";
import { SendMessage } from "./messaging";
import { Storage } from "./storage";

/**
 * Applies CSS variable overrides and updates badge accordingly
 */
async function applyOverridesAndUpdateBadge(themeName: string): Promise<void> {
	const overrides = await Storage.getPreset(themeName);
	const hasOverrides = !!overrides && Object.keys(overrides).length > 0;

	if (hasOverrides) {
		Object.entries(overrides).forEach(([key, value]) => {
			applyCSSVariable(key, value);
		});
	}

	SendMessage.updateBadge(hasOverrides);
}

/**
 * Applies CSS variable overrides for a specific theme
 */
export async function applyThemePreset(themeName: string): Promise<void> {
	await applyOverridesAndUpdateBadge(themeName);
}

/**
 * Handles theme switch: clears old overrides and applies new ones
 */
export async function handleThemeSwitch(newThemeName: string): Promise<void> {
	resetCSSOverrides();
	await applyOverridesAndUpdateBadge(newThemeName);
}

/**
 * Watches for theme changes (class attribute changes on html element)
 */
export function watchThemeChanges(
	onThemeChange: (newTheme: string, oldTheme: string | null) => void,
): MutationObserver {
	let currentTheme = getCurrentTheme();

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "class"
			) {
				const newTheme = getCurrentTheme();

				if (newTheme !== currentTheme) {
					const oldTheme = currentTheme;
					currentTheme = newTheme;
					if (newTheme) {
						onThemeChange(newTheme, oldTheme);
					}
				}
			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return observer;
}
