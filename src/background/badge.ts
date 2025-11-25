import browser from "webextension-polyfill";
import { logger } from "@/lib/logger";
import { Background } from "@/lib/messages";

/**
 * Updates the extension badge for a specific tab
 */
const updateBadge = async (
	tabId: number,
	badgeState: "ON" | "OFF" | "DEFAULT",
) => {
	logger.debug("Updating badge", { tabId, badgeState });

	if (badgeState === "ON") {
		await browser.action.setBadgeText({ text: "ON", tabId });
		await browser.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
	} else if (badgeState === "OFF") {
		await browser.action.setBadgeText({ text: "OFF", tabId });
		await browser.action.setBadgeBackgroundColor({ color: "#999999", tabId });
	} else {
		await browser.action.setBadgeText({ text: "", tabId });
	}
};

// Listen for badge update requests from content script or popup
Background.onMessage("updateBadge", (msg, sender) => {
	// Use tabId from message (popup) or sender.tab (content script)
	const tabId = msg.data.tabId ?? sender.tab?.id;
	if (tabId !== undefined) {
		updateBadge(tabId, msg.data.badgeState);
	}
});

// Listen for tab ID requests from content scripts
Background.onMessage("getTabId", (_msg, sender) => {
	return sender.tab?.id;
});
