import { defineConfig } from "wxt";
import { PUMBLE_URL_PATTERNS } from "./src/constants/pumble-urls";

// See https://wxt.dev/api/config.html
export default defineConfig({
	imports: false,
	srcDir: "src",
	outDir: "dist",
	modules: ["@wxt-dev/module-solid"],
	manifest: {
		name: "pumble-theme-tweaks",
		version: "1.1.0",
		description: "Change Pumble colors in web browser.",
		permissions: ["storage", "scripting"],
		host_permissions: [...PUMBLE_URL_PATTERNS],
		action: {
			default_title: "Change Pumble theme colors",
		},
	},
	webExt: {
		chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
	},
	dev: {
		server: {
			port: 5173,
		},
	},
});
