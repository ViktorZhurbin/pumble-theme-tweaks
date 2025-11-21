import { MessageType } from './messaging.js';

console.log('Background Service Worker: Loaded');

/**
 * Updates the extension badge for a specific tab
 * @param {number} tabId
 * @param {boolean} hasOverrides
 */
function updateBadge(tabId, hasOverrides) {
	if (hasOverrides) {
		chrome.action.setBadgeText({ text: 'ON', tabId });
		chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
	} else {
		chrome.action.setBadgeText({ text: '', tabId });
	}
}

/**
 * Clears the badge when a tab starts loading
 * @param {number} tabId
 */
function clearBadge(tabId) {
	chrome.action.setBadgeText({ text: '', tabId });
}

// Listen for badge update requests from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
	if (msg.type === MessageType.UPDATE_BADGE && sender.tab?.id) {
		updateBadge(sender.tab.id, msg.hasOverrides);
	}
});

// Clear badge when tab starts loading (page navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === 'loading') {
		clearBadge(tabId);
	}
});
