import { colord } from "colord";
import { ContentScript } from "@/entrypoints/content/messenger";
import type { TweakEntry } from "@/types/tweaks";
import { Checkbox } from "../Checkbox/Checkbox";
import { Typography } from "@/components/Typography/Typography";
import styles from "./ColorPicker.module.css";
import { ResetIconButton } from "./ResetIconButton";
import { useThemeEditorContext } from "./ThemeEditorContext";

interface ColorPickerProps {
	label: string;
	propertyName: string;
}

export function ColorPicker(props: ColorPickerProps) {
	const ctx = useThemeEditorContext();

	// Derive from context instead of props
	const tweakEntry = () =>
		ctx.store.themeTweaks?.cssProperties[props.propertyName];
	const inactive = () => !ctx.store.themeTweaksOn;

	const handleInput = (e: Event) => {
		const value = (e.target as HTMLInputElement).value;
		const currentTabId = ctx.tabId();

		if (!currentTabId || !ctx.store.themeName) return;

		ContentScript.sendMessage(
			"updateProperty",
			{ propertyName: props.propertyName, value },
			currentTabId,
		);
	};

	const handleReset = (e: MouseEvent) => {
		e.preventDefault();
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"resetProperty",
			{ propertyName: props.propertyName },
			currentTabId,
		);
	};

	const handleToggle = (e: Event) => {
		const enabled = (e.target as HTMLInputElement).checked;
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"toggleProperty",
			{ propertyName: props.propertyName, enabled },
			currentTabId,
		);
	};

	return (
		<>
			{/* Label cell */}
			<Typography
				class={styles.labelCell}
				classList={{ [styles.inactive]: inactive() }}
			>
				{props.label}
			</Typography>

			{/* Reset button cell */}
			<div
				class={styles.resetCell}
				classList={{ [styles.inactive]: inactive() }}
			>
				{isPropertyModified(tweakEntry()) && (
					<ResetIconButton
						class={styles.resetButton}
						onClick={handleReset}
						disabled={!ctx.isReady() || !ctx.store.themeName}
					/>
				)}
			</div>

			{/* Color input cell */}
			<div
				class={styles.colorCell}
				classList={{ [styles.inactive]: inactive() }}
			>
				<input
					type="color"
					value={colord(getDisplayValue(tweakEntry())).toHex()}
					disabled={inactive() || !ctx.isReady() || !ctx.store.themeName}
					onInput={handleInput}
				/>
			</div>

			{/* Toggle checkbox cell */}
			<div
				class={styles.toggleCell}
				classList={{ [styles.inactive]: inactive() }}
			>
				<Checkbox
					checked={tweakEntry()?.enabled ?? true}
					disabled={inactive() || !ctx.isReady() || !ctx.store.themeName}
					onChange={handleToggle}
					title="Enable this color tweak"
				/>
			</div>
		</>
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

/**
 * Checks if a property has been modified from its initial value
 */
function isPropertyModified(entry: TweakEntry | undefined): boolean {
	if (!entry) return false;

	return entry.value !== null && entry.value !== entry.initialValue;
}
