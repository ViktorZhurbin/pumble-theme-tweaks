import { logger } from "@/lib/logger";
import {
	type GetThemeMessage,
	MessageType,
	type ReadPropertiesMessage,
	type ResetPropertiesMessage,
	type UpdateBadgeMessage,
	type UpdatePropertyMessage,
} from "@/types";

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
 * Requests current CSS property values from the page
 */
const getProperties = (tabId: number): Promise<Record<string, string>> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ReadPropertiesMessage>(
			tabId,
			{ type: MessageType.READ_PROPERTIES },
			(response) => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to read properties:", chrome.runtime.lastError);
					resolve({});
				} else {
					resolve(response || {});
				}
			},
		);
	});
};

/**
 * Requests the current theme name from the page
 */
const getTheme = (tabId: number): Promise<string | null> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<GetThemeMessage>(
			tabId,
			{ type: MessageType.GET_THEME },
			(response) => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to get theme:", chrome.runtime.lastError);
					resolve(null);
				} else {
					resolve(response?.theme || null);
				}
			},
		);
	});
};

/**
 * Sends a reset command to clear CSS properties tweaks
 */
const resetProperties = (tabId: number): Promise<void> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ResetPropertiesMessage>(
			tabId,
			{ type: MessageType.RESET_PROPERTIES },
			() => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to reset properties:", chrome.runtime.lastError);
				}
				resolve();
			},
		);
	});
};

/**
 * Notifies background script to update the badge
 * @param badgeOn - Whether the badge should show "ON"
 * @param tabId - Tab ID (required when called from popup, optional from content script)
 */
const updateBadge = (badgeOn: boolean, tabId?: number) => {
	chrome.runtime.sendMessage<UpdateBadgeMessage>({
		type: MessageType.UPDATE_BADGE,
		badgeOn,
		tabId,
	});
};

export const SendMessage = {
	updateProperty,
	getProperties,
	resetProperties,
	getTheme,
	updateBadge,
};
