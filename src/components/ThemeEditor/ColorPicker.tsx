import { ColorUtils } from "@/lib/color";
import type { TweakEntry } from "@/types/tweaks";
import styles from "./ColorPicker.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

interface ColorPickerProps {
	label: string;
	propertyName: string;
}

export function ColorPicker(props: ColorPickerProps) {
	const ctx = useThemeEditorContext();

	// Derive from context instead of props
	const tweakEntry = () => ctx.store.themeTweaks?.cssProperties[props.propertyName];
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

	const handleReset = () => {
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

	const resetTitle = "Reset to default";

	return (
		<label
			class={styles.pickerGroup}
			classList={{ [styles.inactive]: inactive() }}
		>
			<span class={styles.pickerLabel}>{props.label}</span>
			<div class={styles.pickerControls}>
				{isPropertyModified(tweakEntry()) && (
					<button
						type="button"
						class={styles.resetButton}
						onClick={(e) => {
							e.preventDefault();
							handleReset();
						}}
						disabled={!ctx.isReady() || !ctx.store.themeName}
						title={resetTitle}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<title>{resetTitle}</title>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M3.06 13a9 9 0 1 0 .49 -4.087" />
							<path d="M3 4.001v5h5" />
							<path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
						</svg>
					</button>
				)}
				<input
					type="color"
					value={ColorUtils.toHex(getDisplayValue(tweakEntry()))}
					disabled={inactive() || !ctx.isReady() || !ctx.store.themeName}
					onInput={handleInput}
				/>
				<input
					type="checkbox"
					class={styles.toggleCheckbox}
					checked={tweakEntry()?.enabled ?? true}
					disabled={inactive() || !ctx.isReady() || !ctx.store.themeName}
					onChange={handleToggle}
					title="Enable this color tweak"
				/>
			</div>
		</label>
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
