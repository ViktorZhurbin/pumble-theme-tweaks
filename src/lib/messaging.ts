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
function updateVar(tabId: number, varName: string, value: string): void {
	chrome.tabs.sendMessage<UpdateVarMessage>(tabId, {
		type: MessageType.UPDATE_VAR,
		varName,
		value,
	});
}

/**
 * Requests current CSS variable values from the page
 */
function getVars(tabId: number): Promise<Record<string, string>> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ReadVarsMessage>(
			tabId,
			{ type: MessageType.READ_VARS },
			(response) => {
				if (chrome.runtime.lastError) {
					console.error("Failed to read variables:", chrome.runtime.lastError);
					resolve({}); // Or reject(chrome.runtime.lastError)
				} else {
					resolve(response || {});
				}
			},
		);
	});
}

/**
 * Requests the current theme name from the page
 */
function getTheme(tabId: number): Promise<string | null> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<GetThemeMessage>(
			tabId,
			{ type: MessageType.GET_THEME },
			(response) => {
				resolve(chrome.runtime.lastError ? null : response?.theme || null);
			},
		);
	});
}

/**
 * Sends a reset command to clear CSS variable overrides
 */
function resetVars(tabId: number): Promise<void> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ResetVarsMessage>(
			tabId,
			{ type: MessageType.RESET_VARS },
			() => resolve(),
		);
	});
}

/**
 * Notifies background script to update the badge
 */
function updateBadge(badgeOn: boolean): void {
	chrome.runtime.sendMessage<UpdateBadgeMessage>({
		type: MessageType.UPDATE_BADGE,
		badgeOn,
	});
}

export const SendMessage = {
	updateVar,
	getVars,
	getTheme,
	resetVars,
	updateBadge,
};
