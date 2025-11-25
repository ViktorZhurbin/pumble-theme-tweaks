import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	imports: false,
	srcDir: "src",
	outDir: "dist",
	modules: ["@wxt-dev/module-solid"],
	manifest: {
		name: "pumble-theme-tweaks",
		version: "1.0.0",
		description: "Change Pumble colors in web browser.",
		permissions: ["storage"],
		action: {
			default_title: "Change Pumble theme colors",
		},
	},
	webExt: {
		chromiumArgs: ["--user-data-dir=./.wxt/chrome-data"],
	},
});
