import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { logger } from "@/lib/logger";
import { Background } from "./messenger";

export default defineBackground(() => {
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
	Background.onMessage("updateBadge", (message) => {
		const tabId = message.data.tabId ?? message.sender.tab?.id;
		if (tabId !== undefined) {
			updateBadge(tabId, message.data.badgeState);
		}
	});

	// Listen for tab ID requests from content scripts
	Background.onMessage("getTabId", (message) => {
		return message.sender.tab?.id;
	});
});
