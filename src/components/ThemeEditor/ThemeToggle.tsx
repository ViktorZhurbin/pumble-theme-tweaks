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
		<div>
			<label class={styles.toggleLabel}>
				<input
					type="checkbox"
					checked={props.checked}
					onChange={handleChange}
				/>
				Toggle theme tweaks
			</label>
		</div>
	);
}
