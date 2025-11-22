import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
	label: string;
	value: string;
	inactive?: boolean;
	onInput: (value: string) => void;
}

export function ColorPicker({
	label,
	value,
	inactive = false,
	onInput,
}: ColorPickerProps) {
	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		onInput(target.value);
	};

	const pickerClass = inactive
		? `${styles.pickerGroup} ${styles.inactive}`
		: styles.pickerGroup;

	return (
		<label class={pickerClass}>
			<span class={styles.pickerLabel}>{label}</span>
			<input type="color" value={value} onInput={handleInput} />
		</label>
	);
}
