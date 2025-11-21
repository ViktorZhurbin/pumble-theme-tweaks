/**
 * Message types for communication between popup, content script, and background
 */
export const MessageType = {
	UPDATE_VAR: 'UPDATE_VAR',
	READ_VARS: 'READ_VARS',
	GET_THEME: 'GET_THEME',
	RESET_VARS: 'RESET_VARS',
	UPDATE_BADGE: 'UPDATE_BADGE',
};

/**
 * Sends a message to update a CSS variable in the active tab
 * @param {number} tabId
 * @param {string} varName
 * @param {string} value
 */
export function sendUpdateVar(tabId, varName, value) {
	chrome.tabs.sendMessage(tabId, {
		type: MessageType.UPDATE_VAR,
		varName,
		value,
	});
}

/**
 * Requests current CSS variable values from the page
 * @param {number} tabId
 * @param {string[]} variableNames
 * @returns {Promise<Object.<string, string>>}
 */
export function requestVariableValues(tabId, variableNames) {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(
			tabId,
			{ type: MessageType.READ_VARS, vars: variableNames },
			(response) => {
				resolve(chrome.runtime.lastError ? {} : response || {});
			}
		);
	});
}

/**
 * Requests the current theme name from the page
 * @param {number} tabId
 * @returns {Promise<string | null>}
 */
export function requestThemeName(tabId) {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(
			tabId,
			{ type: MessageType.GET_THEME },
			(response) => {
				resolve(chrome.runtime.lastError ? null : response?.theme || null);
			}
		);
	});
}

/**
 * Sends a reset command to clear CSS variable overrides
 * @param {number} tabId
 * @param {string[]} variableNames
 * @returns {Promise<void>}
 */
export function sendResetVars(tabId, variableNames) {
	return new Promise((resolve) => {
		chrome.tabs.sendMessage(
			tabId,
			{ type: MessageType.RESET_VARS, vars: variableNames },
			() => resolve()
		);
	});
}

/**
 * Notifies background script to update the badge
 * @param {boolean} hasOverrides
 */
export function notifyBadgeUpdate(hasOverrides) {
	chrome.runtime.sendMessage({
		type: MessageType.UPDATE_BADGE,
		hasOverrides,
	});
}
