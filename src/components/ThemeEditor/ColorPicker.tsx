import { ColorUtils } from "@/lib/color";
import type { TweakEntry } from "@/types/tweaks";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
	label: string;
	tweakEntry?: TweakEntry;
	inactive?: boolean;
	onInput: (value: string) => void;
	onReset: () => void;
	onToggle?: (checked: boolean) => void;
}

export function ColorPicker(props: ColorPickerProps) {
	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onInput(target.value);
	};

	const handleToggle = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onToggle?.(target.checked);
	};

	const resetTitle = "Reset to default";

	return (
		<label
			class={styles.pickerGroup}
			classList={{ [styles.inactive]: props.inactive }}
		>
			<span class={styles.pickerLabel}>{props.label}</span>
			<div class={styles.pickerControls}>
				{isPropertyModified(props.tweakEntry) && (
					<button
						type="button"
						class={styles.resetButton}
						onClick={(e) => {
							e.preventDefault();
							props.onReset?.();
						}}
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
					value={ColorUtils.toHex(getDisplayValue(props.tweakEntry))}
					disabled={props.inactive}
					onInput={handleInput}
				/>
				<input
					type="checkbox"
					class={styles.toggleCheckbox}
					checked={props.tweakEntry?.enabled ?? true}
					disabled={props.inactive}
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
