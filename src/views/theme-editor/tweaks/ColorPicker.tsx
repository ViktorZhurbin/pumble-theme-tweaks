import { colord } from "colord";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import type { TweakEntry } from "@/types/tweaks";
import { useWorkingTweak } from "../hooks";
import styles from "./ColorPicker.module.css";

export const ColorPicker = (props: {
	propertyName: string;
	disabled: boolean;
}) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);

	const handleInput = (e: Event) => {
		const value = (e.target as HTMLInputElement).value;

		ctx.sendToContent("updateWorkingProperty", {
			propertyName: props.propertyName,
			value,
		});
	};

	return (
		<div class="tooltip" data-tip="Pick a color">
			<input
				type="color"
				class={`${styles.colorInput} border-2 border-neutral-600 bg-none h-9 w-9`}
				value={getHexDisplayValue(tweakEntry())}
				disabled={props.disabled}
				onInput={handleInput}
			/>
		</div>
	);
};

/**
 * Gets the display value for a color picker
 * Returns the user's custom value if enabled and set, otherwise the initial DOM value
 * Always normalizes to opaque HEX (input type="color" only accepts 6-char hex)
 */
function getHexDisplayValue(entry: TweakEntry | undefined): string {
	if (!entry) return "";

	const baseValue =
		entry.enabled && entry.value !== null ? entry.value : entry.initialValue;

	// Normalize to opaque HEX for color picker compatibility
	// (initialValue from DOM might have alpha, but we store opaque base values)
	return colord(baseValue).alpha(1).toHex();
}
