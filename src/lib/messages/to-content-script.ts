import type { RuntimeState } from "./types";
import { createMessageAction } from "./action-creator";

/**
 * Messages sent FROM popup TO content script
 * Ultra-simple pattern: define type, get sender + type guard automatically
 */

export const ToContentScript = {
	/**
	 * Updates a single CSS property for the current theme
	 */
	updateProperty: createMessageAction<{
		tabId: number;
		propertyName: string;
		value: string;
	}>("UPDATE_PROPERTY"),

	/**
	 * Toggles tweaks on/off for the current theme
	 */
	toggleTweaks: createMessageAction<{
		tabId: number;
		enabled: boolean;
	}>("TOGGLE_TWEAKS"),

	/**
	 * Resets all tweaks for the current theme
	 */
	resetTweaks: createMessageAction<{
		tabId: number;
	}>("RESET_TWEAKS"),

	/**
	 * Gets the current runtime state from content script
	 * Returns a promise with the RuntimeState
	 */
	getCurrentState: createMessageAction<{ tabId: number }, RuntimeState>(
		"GET_STATE",
		{ expectResponse: true },
	),
};
