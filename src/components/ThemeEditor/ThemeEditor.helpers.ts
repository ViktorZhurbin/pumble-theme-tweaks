import { browser } from "#imports";
import { ContentScript } from "@/entrypoints/content/messenger";
import { BrowserUtils } from "@/lib/browser-utils";
import { logger } from "@/lib/logger";
import type { RuntimeState } from "@/types/runtime";

/**
 * Helper to get current state from content script
 */
export const getContentScriptState = async (
	tabId: number,
): Promise<RuntimeState> => {
	return await ContentScript.sendMessage("getCurrentState", undefined, tabId);
};

/**
 * Helper to check if error is a connection error (content script not present)
 */
export const isConnectionError = (err: unknown): boolean => {
	const errorMessage = err instanceof Error ? err.message : "";
	return (
		errorMessage.includes("Receiving end does not exist") ||
		errorMessage.includes("Could not establish connection")
	);
};

/**
 * Initialization helper: Get and validate active tab
 * Returns tab ID
 */
export const initializeTab = async (): Promise<number> => {
	const tab = await BrowserUtils.getActiveTab();
	if (!tab?.id) {
		throw new Error("Please open a Pumble tab");
	}
	return tab.id;
};

/**
 * Injects the content script programmatically into a tab
 * Used when the content script isn't already present (e.g., on first install)
 */
export const injectContentScript = async (tabId: number): Promise<void> => {
	try {
		await browser.scripting.executeScript({
			target: { tabId },
			files: ["/content-scripts/content.js"],
		});
		logger.info("Content script injected successfully", { tabId });
	} catch (err) {
		logger.error("Failed to inject content script", { error: err, tabId });
		throw new Error("Failed to inject content script");
	}
};
