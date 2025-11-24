import styles from "./ResetButton.module.css";

interface ResetButtonProps {
	disabled: boolean;
	onClick: () => void;
}

export function ResetButton(props: ResetButtonProps) {
	return (
		<button
			type="button"
			class={styles.resetBtn}
			onClick={props.onClick}
			disabled={props.disabled}
			title={props.disabled ? "No tweaks to reset" : "Reset tweaks for this theme"}
		>
			Reset
		</button>
	);
}
