import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
	checked: boolean;
	disabled: boolean;
	onChange: (checked: boolean) => void;
}

export function ThemeToggle(props: ThemeToggleProps) {
	const handleChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onChange(target.checked);
	};

	return (
		<label class={styles.toggleLabel} aria-disabled={props.disabled}>
			<input
				type="checkbox"
				disabled={props.disabled}
				checked={props.checked}
				onChange={handleChange}
			/>
			Toggle theme tweaks
		</label>
	);
}
