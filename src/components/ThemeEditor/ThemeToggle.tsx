import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function ThemeToggle(props: ThemeToggleProps) {
	const handleChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		props.onChange(target.checked);
	};

	return (
		<div class={styles.toggleContainer}>
			<label for="toggle-overrides" class={styles.toggleLabel}>
				<input
					id="toggle-overrides"
					type="checkbox"
					checked={props.checked}
					onChange={handleChange}
				/>
				{props.checked ? "Tweaks ON" : "Tweaks OFF"}
			</label>
		</div>
	);
}
