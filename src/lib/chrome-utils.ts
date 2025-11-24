import browser from "webextension-polyfill";

const getActiveTab = async () => {
	const [tab] = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	return tab || null;
};

export const ChromeUtils = {
	getActiveTab,
};
