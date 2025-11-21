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
export function sendUpdateVar(
	tabId: number,
	varName: string,
	value: string,
): void {
	chrome.tabs.sendMessage<UpdateVarMessage>(tabId, {
		type: MessageType.UPDATE_VAR,
		varName,
		value,
	});
}

/**
 * Requests current CSS variable values from the page
 */
export function requestVariableValues(
	tabId: number,
	variableNames: string[],
): Promise<Record<string, string>> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage<ReadVarsMessage>(
			tabId,
			{ type: MessageType.READ_VARS, vars: variableNames },
			(response) => {
				resolve(chrome.runtime.lastError ? {} : response || {});
			},
		);
	});
}

/**
 * Requests the current theme name from the page
 */
export function requestThemeName(tabId: number): Promise<string | null> {
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
export function sendResetVars(tabId: number): Promise<void> {
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
export function setBadgeOn(isOn: boolean): void {
	chrome.runtime.sendMessage<UpdateBadgeMessage>({
		type: MessageType.UPDATE_BADGE,
		isOn,
	});
}
