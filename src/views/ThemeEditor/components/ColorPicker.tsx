import { colord } from "colord";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import type { TweakEntry } from "@/types/tweaks";
import styles from "./ColorPicker.module.css";

export function ColorPicker(props: {
	propertyName: string;
	disabled: boolean;
}) {
	const ctx = useThemeEditorContext();

	// Derive from context instead of props
	const tweakEntry = () =>
		ctx.store.workingTweaks?.cssProperties[props.propertyName];

	const handleInput = (e: Event) => {
		const value = (e.target as HTMLInputElement).value;
		const currentTabId = ctx.tabId();

		if (!currentTabId || !ctx.store.themeName) return;

		ContentScript.sendMessage(
			"updateWorkingProperty",
			{ propertyName: props.propertyName, value },
			currentTabId,
		);
	};

	return (
		<input
			type="color"
			class={styles.colorInput}
			value={colord(getDisplayValue(tweakEntry())).toHex()}
			disabled={props.disabled}
			onInput={handleInput}
		/>
	);
}

/**
 * Gets the display value for a color picker
 * Returns the user's custom value if enabled and set, otherwise the initial DOM value
 */
function getDisplayValue(entry: TweakEntry | undefined): string {
	if (!entry) return "";

	return entry.enabled && entry.value !== null
		? entry.value
		: entry.initialValue;
}
