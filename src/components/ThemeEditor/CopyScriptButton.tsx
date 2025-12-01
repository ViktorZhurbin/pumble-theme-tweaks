import { DERIVED_COLORS } from "@/constants/derived-colors";
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
		const derived = DERIVED_COLORS[item.propertyName];

		if (!entry && !derived) return [];

		const value =
			entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

		if (derived) {
			return derived.map((item) => ({
				name: item.propertyName,
				value: item.derive(value),
			}));
		}

		return { name: item.propertyName, value };
	});

	return properties;
}
