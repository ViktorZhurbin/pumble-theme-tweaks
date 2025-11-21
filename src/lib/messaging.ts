import { MessageType } from '@/types'

/**
 * Sends a message to update a CSS variable in the active tab
 */
export function sendUpdateVar(tabId: number, varName: string, value: string): void {
	chrome.tabs.sendMessage(tabId, {
		type: MessageType.UPDATE_VAR,
		varName,
		value,
	})
}

/**
 * Requests current CSS variable values from the page
 */
export function requestVariableValues(
	tabId: number,
	variableNames: string[]
): Promise<Record<string, string>> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(
			tabId,
			{ type: MessageType.READ_VARS, vars: variableNames },
			(response) => {
				resolve(chrome.runtime.lastError ? {} : response || {})
			}
		)
	})
}

/**
 * Requests the current theme name from the page
 */
export function requestThemeName(tabId: number): Promise<string | null> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(tabId, { type: MessageType.GET_THEME }, (response) => {
			resolve(chrome.runtime.lastError ? null : response?.theme || null)
		})
	})
}

/**
 * Sends a reset command to clear CSS variable overrides
 */
export function sendResetVars(tabId: number, variableNames: string[]): Promise<void> {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(tabId, { type: MessageType.RESET_VARS, vars: variableNames }, () =>
			resolve()
		)
	})
}

/**
 * Notifies background script to update the badge
 */
export function notifyBadgeUpdate(hasOverrides: boolean): void {
	chrome.runtime.sendMessage({
		type: MessageType.UPDATE_BADGE,
		hasOverrides,
	})
}
