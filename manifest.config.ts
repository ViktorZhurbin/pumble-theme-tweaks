import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
	manifest_version: 3,
	name: pkg.name,
	version: pkg.version,
	description: "Change Pumble colors in web browser.",
	icons: {
		48: "public/logo.png",
	},
	action: {
		default_icon: {
			48: "public/logo.png",
		},
		default_popup: "src/popup/index.html",
		default_title: "Change Pumble theme colors",
	},
	background: {
		service_worker: "src/background/badge.ts",
	},
	content_scripts: [
		{
			js: ["src/content/main.ts"],
			matches: ["https://app.pumble.com/*"],
		},
	],
	permissions: ["storage", "sidePanel"],
	side_panel: {
		default_path: "src/sidepanel/index.html",
	},
});
