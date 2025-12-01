import styles from "./ToggleCheckbox.module.css";

interface ToggleCheckboxProps {
	checked: boolean;
	disabled?: boolean;
	onChange: (e: Event) => void;
	title?: string;
	class?: string;
}

export function ToggleCheckbox(props: ToggleCheckboxProps) {
	return (
		<input
			type="checkbox"
			class={`${styles.checkbox} ${props.class ?? ""}`}
			checked={props.checked}
			disabled={props.disabled}
			onChange={props.onChange}
			title={props.title}
		/>
	);
}
