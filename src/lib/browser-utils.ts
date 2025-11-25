import { browser } from "wxt/browser";

const getActiveTab = async () => {
	const [tab] = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	return tab || null;
};

export const BrowserUtils = {
	getActiveTab,
};
