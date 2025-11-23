import { logger } from "@/lib/logger";
import { type Message, MessageType } from "@/types";

/**
 * Updates the extension badge for a specific tab
 */
const updateBadge = (tabId: number, isOn: boolean) => {
	logger.debug("Updating badge", { tabId, isOn });
	if (isOn) {
		chrome.action.setBadgeText({ text: "ON", tabId });
		chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
	} else {
		chrome.action.setBadgeText({ text: "", tabId });
	}
};

// Listen for badge update requests from content script or popup
chrome.runtime.onMessage.addListener((msg: Message, sender) => {
	if (msg.type === MessageType.UPDATE_BADGE) {
		// Use tabId from message (popup) or sender.tab (content script)
		const tabId = msg.tabId ?? sender.tab?.id;
		if (tabId) {
			updateBadge(tabId, msg.badgeOn);
		}
	}
});
