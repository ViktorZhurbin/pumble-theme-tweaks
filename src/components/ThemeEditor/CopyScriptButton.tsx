import { PROPERTIES } from "@/constants/properties";
import type { ThemeTweaks } from "@/types/tweaks";
import { CopyButton } from "../CopyButton/CopyButton";
import { useThemeEditorContext } from "./ThemeEditorContext";

export const CopyScriptButton = () => {
	const ctx = useThemeEditorContext();

	const handleCopy = async () => {
		const values = getThemeValues(ctx.store.themeTweaks);

		console.log(values);

		return `(function() { ${JSON.stringify(values)}.forEach(({ name, value }) => { document.documentElement.style.setProperty(name, value) }) })()`;
	};

	return (
		<CopyButton
			disabled={!ctx.store.themeTweaksOn}
			title={
				!ctx.store.themeTweaksOn
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

	return PROPERTIES.flatMap((item) => {
		const entry = themeTweaks.cssProperties[item.propertyName];

		if (!entry) return [];

		const value =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		return { name: item.propertyName, value };
	});
}
