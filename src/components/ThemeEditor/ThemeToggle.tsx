import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function ThemeToggle({ checked, onChange }: ThemeToggleProps) {
	const handleChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		onChange(target.checked);
	};

	return (
		<div class={styles.toggleContainer}>
			<label for="toggle-overrides" class={styles.toggleLabel}>
				<input
					id="toggle-overrides"
					type="checkbox"
					checked={checked}
					onChange={handleChange}
				/>
				{checked ? "Tweaks ON" : "Tweaks OFF"}
			</label>
		</div>
	);
}
