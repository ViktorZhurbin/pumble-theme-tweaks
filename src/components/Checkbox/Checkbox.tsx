import styles from "./Checkbox.module.css";

interface CheckboxProps {
	checked: boolean;
	disabled?: boolean;
	onChange: (e: Event) => void;
	title?: string;
	class?: string;
}

export function Checkbox(props: CheckboxProps) {
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
