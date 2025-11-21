import {
	applyCSSVariable,
	getCurrentTheme,
	resetCSSOverrides,
} from "./dom-utils";
import { setBadgeOn } from "./messaging";
import { getStoredPreset } from "./storage";

/**
 * Applies CSS variable overrides for a specific theme
 */
export async function applyThemePreset(themeName: string) {
	const overrides = await getStoredPreset(themeName);

	// console.log({ overrides });

	if (overrides && Object.keys(overrides).length > 0) {
		// console.log(`Applying preset for theme: ${themeName}`, overrides);
		Object.entries(overrides).forEach(([key, value]) => {
			applyCSSVariable(key, value);
		});
		setBadgeOn(true);
	} else {
		// console.log(`No preset found for theme: ${themeName}`);
		setBadgeOn(false);
	}
}

/**
 * Handles theme switch: clears old overrides and applies new ones
 */
export async function handleThemeSwitch(newThemeName: string): Promise<void> {
	// Clear all variables first
	resetCSSOverrides();

	if (!newThemeName) {
		setBadgeOn(false);
		return;
	}

	// Apply preset for new theme if it exists
	const overrides = await getStoredPreset(newThemeName);

	if (overrides && Object.keys(overrides).length > 0) {
		console.log(`Applying saved preset for theme: ${newThemeName}`);
		Object.entries(overrides).forEach(([key, value]) => {
			applyCSSVariable(key, value);
		});
		setBadgeOn(true);
	} else {
		console.log(
			`No preset found for theme: ${newThemeName}, overrides removed`,
		);
		setBadgeOn(false);
	}
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
					console.log(`Theme changed from "${currentTheme}" to "${newTheme}"`);
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
