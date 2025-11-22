import "./ThemeToggle.css";

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
		<div class="toggle-container">
			<label for="toggle-overrides" class="toggle-label">
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
