import { fakeBrowser } from "@webext-core/fake-browser";
import { afterEach, beforeAll, vi } from "vitest";

// Setup fake browser globals for chrome.* APIs
beforeAll(() => {
	// @ts-expect-error - Global assignment for testing
	global.chrome = fakeBrowser;
	// @ts-expect-error - Global assignment for testing
	global.browser = fakeBrowser;
});

// Mock WXT runtime module
vi.mock("wxt/browser", () => ({
	browser: fakeBrowser,
	chrome: fakeBrowser,
}));

// Clean up after each test
afterEach(() => {
	vi.clearAllMocks();
});
