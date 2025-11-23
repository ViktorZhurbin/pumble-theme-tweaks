import { initialState } from "@/content/theme-state";
import { logger } from "@/lib/logger";
import {
	type GetStateMessage,
	MessageType,
	type ResetTweaksMessage,
	type RuntimeState,
	type ToggleTweaksMessage,
	type UpdatePropertyMessage,
} from "@/lib/messages/types";

/**
 * Messages sent FROM popup TO content script
 * These are commands that the popup sends to the content script running in the active tab
 */

/**
 * Sends a message to update a CSS property in the active tab
 */
const updateProperty = (tabId: number, propertyName: string, value: string) => {
	chrome.tabs.sendMessage<UpdatePropertyMessage>(tabId, {
		type: MessageType.UPDATE_PROPERTY,
		propertyName,
		value,
	});
};

/**
 * Gets the current runtime state from content script (ThemeState)
 */
const getCurrentState = (tabId: number): Promise<RuntimeState> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<GetStateMessage>(
			tabId,
			{ type: MessageType.GET_STATE },
			(response) => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to get state:", chrome.runtime.lastError);
					resolve(initialState);
				} else {
					resolve(response);
				}
			},
		);
	});
};

/**
 * Toggles tweaks on/off in content script
 */
const toggleTweaks = (tabId: number, enabled: boolean): void => {
	chrome.tabs.sendMessage<ToggleTweaksMessage>(tabId, {
		type: MessageType.TOGGLE_TWEAKS,
		enabled,
	});
};

/**
 * Resets all tweaks for current theme via content script
 */
const resetTweaks = (tabId: number): void => {
	chrome.tabs.sendMessage<ResetTweaksMessage>(tabId, {
		type: MessageType.RESET_TWEAKS,
	});
};

export const ToContentScript = {
	updateProperty,
	getCurrentState,
	toggleTweaks,
	resetTweaks,
};
