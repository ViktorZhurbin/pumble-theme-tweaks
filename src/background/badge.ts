import browser from "webextension-polyfill";
import { logger } from "@/lib/logger";
import { Background } from "@/lib/messages";

/**
 * Updates the extension badge for a specific tab
 */
const updateBadge = async (tabId: number, isOn: boolean) => {
	logger.debug("Updating badge", { tabId, isOn });
	if (isOn) {
		await browser.action.setBadgeText({ text: "ON", tabId });
		await browser.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
	} else {
		await browser.action.setBadgeText({ text: "", tabId });
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
