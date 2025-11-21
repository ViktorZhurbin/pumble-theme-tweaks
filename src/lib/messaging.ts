import { logger } from "@/lib/logger";
import {
	type GetThemeMessage,
	MessageType,
	type ReadVarsMessage,
	type ResetVarsMessage,
	type UpdateBadgeMessage,
	type UpdateVarMessage,
} from "@/types";

/**
 * Sends a message to update a CSS variable in the active tab
 */
const updateVar = (tabId: number, varName: string, value: string) => {
	chrome.tabs.sendMessage<UpdateVarMessage>(tabId, {
		type: MessageType.UPDATE_VAR,
		varName,
		value,
	});
};

/**
 * Requests current CSS variable values from the page
 */
const getVars = (tabId: number): Promise<Record<string, string>> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ReadVarsMessage>(
			tabId,
			{ type: MessageType.READ_VARS },
			(response) => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to read variables:", chrome.runtime.lastError);
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
 * Sends a reset command to clear CSS variable overrides
 */
const resetVars = (tabId: number): Promise<void> => {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ResetVarsMessage>(
			tabId,
			{ type: MessageType.RESET_VARS },
			() => {
				if (chrome.runtime.lastError) {
					logger.error("Failed to reset variables:", chrome.runtime.lastError);
				}
				resolve();
			},
		);
	});
};

/**
 * Notifies background script to update the badge
 */
const updateBadge = (badgeOn: boolean) => {
	chrome.runtime.sendMessage<UpdateBadgeMessage>({
		type: MessageType.UPDATE_BADGE,
		badgeOn,
	});
};

export const SendMessage = {
	updateVar,
	getVars,
	getTheme,
	resetVars,
	updateBadge,
};
