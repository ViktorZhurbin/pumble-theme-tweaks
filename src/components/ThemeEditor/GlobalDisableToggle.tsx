import styles from "./GlobalDisableToggle.module.css";

interface GlobalDisableToggleProps {
	disabled: boolean;
	onChange: (disabled: boolean) => void;
}

export function GlobalDisableToggle(props: GlobalDisableToggleProps) {
	const handleToggle = (newDisabled: boolean) => {
		props.onChange(newDisabled);
	};

	return (
		<div class={styles.toggle}>
			<button
				type="button"
				class={styles.toggleBtn}
				classList={{ [styles.toggleBtnActive]: !props.disabled }}
				onClick={() => handleToggle(false)}
			>
				On
			</button>
			<button
				type="button"
				class={styles.toggleBtn}
				classList={{ [styles.toggleBtnActive]: props.disabled }}
				onClick={() => handleToggle(true)}
			>
				Off
			</button>
		</div>
	);
}
