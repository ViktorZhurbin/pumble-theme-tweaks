import { MessageType, type UpdateBadgeMessage, type Message } from '@/types'

console.log('Background Service Worker: Loaded')

/**
 * Updates the extension badge for a specific tab
 */
function updateBadge(tabId: number, hasOverrides: boolean): void {
	if (hasOverrides) {
		chrome.action.setBadgeText({ text: 'ON', tabId })
		chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId })
	} else {
		chrome.action.setBadgeText({ text: '', tabId })
	}
}

/**
 * Clears the badge when a tab starts loading
 */
function clearBadge(tabId: number): void {
	chrome.action.setBadgeText({ text: '', tabId })
}

// Listen for badge update requests from content script
chrome.runtime.onMessage.addListener((msg: Message, sender) => {
	if (msg.type === MessageType.UPDATE_BADGE && sender.tab?.id) {
		const badgeMsg = msg as UpdateBadgeMessage
		updateBadge(sender.tab.id, badgeMsg.hasOverrides)
	}
})

// Clear badge when tab starts loading (page navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.status === 'loading') {
		clearBadge(tabId)
	}
})
