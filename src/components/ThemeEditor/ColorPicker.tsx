import { ColorUtils } from "@/lib/color";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
	label: string;
	value: string;
	inactive?: boolean;
	isModified?: boolean;
	onInput: (value: string) => void;
	onReset?: () => void;
}

export function ColorPicker(props: ColorPickerProps) {
	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onInput(target.value);
	};

	const resetTitle = "Reset to default";

	return (
		<label
			class={styles.pickerGroup}
			classList={{ [styles.inactive]: props.inactive }}
		>
			<span class={styles.pickerLabel}>
				{props.label}
				{props.isModified && (
					<span class={styles.badge} title="Modified from default" />
				)}
			</span>
			<div class={styles.pickerControls}>
				{props.isModified && props.onReset && (
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
					value={ColorUtils.toHex(props.value)}
					disabled={props.inactive}
					onInput={handleInput}
				/>
			</div>
		</label>
	);
}
