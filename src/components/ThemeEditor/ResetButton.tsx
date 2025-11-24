import { createSignal } from "solid-js";
import styles from "./ResetButton.module.css";

interface ResetButtonProps {
	disabled: boolean;
	onClick: () => void;
}

export function ResetButton(props: ResetButtonProps) {
	const [showConfirm, setShowConfirm] = createSignal(false);

	const handleClick = () => {
		if (props.disabled) return;
		setShowConfirm(true);
	};

	const handleConfirm = () => {
		setShowConfirm(false);
		props.onClick();
	};

	const handleCancel = () => {
		setShowConfirm(false);
	};

	return (
		<div class={styles.container}>
			{!showConfirm() ? (
				<button
					type="button"
					class={styles.resetBtn}
					onClick={handleClick}
					disabled={props.disabled}
					title={
						props.disabled ? "No tweaks to reset" : "Reset tweaks for this theme"
					}
				>
					Reset
				</button>
			) : (
				<div class={styles.confirmContainer}>
					<span class={styles.confirmText}>You sure?</span>
					<div class={styles.confirmButtons}>
						<button
							type="button"
							class={styles.cancelBtn}
							onClick={handleCancel}
						>
							Cancel
						</button>
						<button
							type="button"
							class={styles.confirmBtn}
							onClick={handleConfirm}
						>
							Reset
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
