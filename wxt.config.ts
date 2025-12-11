import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import { PUMBLE_URL_PATTERNS } from "./src/constants/pumble-urls";

// See https://wxt.dev/api/config.html
export default defineConfig({
	imports: false,
	srcDir: "src",
	outDir: "dist",
	modules: ["@wxt-dev/module-solid"],
	manifest: {
		name: "Pumble Tweaks",
		version: "2.2.2",
		description: "Change Pumble colors in web browser.",
		permissions: ["storage", "scripting"],
		host_permissions: [...PUMBLE_URL_PATTERNS],
		action: {
			default_title: "Change Pumble theme colors",
		},
	},
	webExt: {
		chromiumPort: 9222,
		startUrls: ["https://app.pumble.com"],
		openDevtools: true,
		openConsole: true,
		binaries: {
			chrome:
				"/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
		},
		chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
	},
	dev: {
		server: {
			port: 5173,
		},
	},
	vite: () => ({
		plugins: [tailwindcss()],
		build: {
			minify: false, // Easier review, better debugging
		},
	}),
});
