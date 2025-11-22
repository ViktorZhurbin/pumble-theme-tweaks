import "./ColorPicker.css";

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

	return (
		<label class={`picker-group ${inactive ? "inactive" : ""}`}>
			<span class="picker-label">{label}</span>
			<input type="color" value={value} onInput={handleInput} />
		</label>
	);
}
