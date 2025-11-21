import {
	applyCSSVariable,
	removeCSSVariable,
	getCurrentTheme,
} from "./dom-utils";
import { getThemePreset, getAllUsedVariableNames } from "./storage";
import { notifyBadgeUpdate } from "./messaging";

/**
 * Applies CSS variable overrides for a specific theme
 */
export async function applyThemePreset(themeName: string): Promise<void> {
	const overrides = await getThemePreset(themeName);

	if (Object.keys(overrides).length > 0) {
		console.log(`Applying preset for theme: ${themeName}`, overrides);
		Object.entries(overrides).forEach(([key, value]) => {
			applyCSSVariable(key, value);
		});
		notifyBadgeUpdate(true);
	} else {
		console.log(`No preset found for theme: ${themeName}`);
		notifyBadgeUpdate(false);
	}
}

/**
 * Clears all CSS variable overrides that might be set
 */
export async function clearAllOverrides(): Promise<void> {
	const allVarNames = await getAllUsedVariableNames();
	allVarNames.forEach((varName) => {
		removeCSSVariable(varName);
	});
}

/**
 * Handles theme switch: clears old overrides and applies new ones
 */
export async function handleThemeSwitch(newThemeName: string): Promise<void> {
	// Clear all variables first
	await clearAllOverrides();

	// Apply preset for new theme if it exists
	if (newThemeName) {
		const overrides = await getThemePreset(newThemeName);

		if (Object.keys(overrides).length > 0) {
			console.log(`Applying saved preset for theme: ${newThemeName}`);
			Object.entries(overrides).forEach(([key, value]) => {
				applyCSSVariable(key, value);
			});
			notifyBadgeUpdate(true);
		} else {
			console.log(
				`No preset found for theme: ${newThemeName}, overrides removed`,
			);
			notifyBadgeUpdate(false);
		}
	} else {
		notifyBadgeUpdate(false);
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
