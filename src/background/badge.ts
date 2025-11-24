import { logger } from "@/lib/logger";
import { Background } from "@/lib/messages";

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
Background.onMessage("updateBadge", (msg, sender) => {
	// Use tabId from message (popup) or sender.tab (content script)
	const tabId = msg.data.tabId ?? sender.tab?.id;
	if (tabId !== undefined) {
		updateBadge(tabId, msg.data.badgeOn);
	}
});
