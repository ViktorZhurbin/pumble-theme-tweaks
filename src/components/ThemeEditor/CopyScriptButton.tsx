import { colord } from "colord";
import { PROPERTIES } from "@/constants/properties";
import type { ThemeTweaks } from "@/types/tweaks";
import { CopyButton } from "../CopyButton/CopyButton";
import { useThemeEditorContext } from "./ThemeEditorContext";

export const CopyScriptButton = () => {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.themeTweaksOn;

	const handleCopy = async () => {
		const values = getThemeValues(ctx.store.themeTweaks);

		return `(function() { ${JSON.stringify(values)}.forEach(({ name, value }) => { document.documentElement.style.setProperty(name, value) }) })()`;
	};

	return (
		<CopyButton
			disabled={disabled()}
			title={
				disabled()
					? "Enable tweaks to copy"
					: "Run this in DevTools console of the desktop app"
			}
			label="Copy script"
			onCopy={handleCopy}
		/>
	);
};

function getThemeValues(themeTweaks: ThemeTweaks | undefined) {
	if (!themeTweaks) return [];

	const properties = PROPERTIES.flatMap((item) => {
		const entry = themeTweaks.cssProperties[item.propertyName];

		if (!entry) return [];

		const value =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		return { name: item.propertyName, value };
	});

	// Inject title-bar-bg for desktop, which is not available on the web
	const main = properties.find(
		(item) => item.name === "--palette-secondary-main",
	);

	if (main) {
		properties.push({
			name: "--palette-secondary-dark",
			value: colord(main.value).darken(0.06).toRgbString(),
		});
		properties.push({
			name: "--palette-secondary-light",
			value: colord(main.value).lighten(0.02).toRgbString(),
		});
	}

	return properties;
}
