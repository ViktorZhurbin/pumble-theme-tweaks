import { type Message, MessageType } from "@/types";

// console.log("Background Service Worker: Loaded");

/**
 * Updates the extension badge for a specific tab
 */
function updateBadge(tabId: number, isOn: boolean): void {
	if (isOn) {
		chrome.action.setBadgeText({ text: "ON", tabId });
		chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
	} else {
		chrome.action.setBadgeText({ text: "", tabId });
	}
}

// Listen for badge update requests from content script
chrome.runtime.onMessage.addListener((msg: Message, sender) => {
	if (msg.type === MessageType.UPDATE_BADGE && sender.tab?.id) {
		updateBadge(sender.tab.id, msg.isOn);
	}
});
