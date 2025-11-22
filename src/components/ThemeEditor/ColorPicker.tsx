import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
	label: string;
	value: string;
	inactive?: boolean;
	onInput: (value: string) => void;
}

export function ColorPicker(props: ColorPickerProps) {
	const handleInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onInput(target.value);
	};

	return (
		<label class={styles.pickerGroup} classList={{ [styles.inactive]: props.inactive }}>
			<span class={styles.pickerLabel}>{props.label}</span>
			<input type="color" value={props.value} onInput={handleInput} />
		</label>
	);
}
