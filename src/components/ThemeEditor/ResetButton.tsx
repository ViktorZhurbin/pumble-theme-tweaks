import { createSignal } from "solid-js";
import styles from "./ResetButton.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

export function ResetButton() {
	const ctx = useThemeEditorContext();
	const [showConfirm, setShowConfirm] = createSignal(false);

	// Derive from context - disabled if no modifications or tweaks are off
	const hasModifications = () =>
		ctx.store.themeTweaks?.cssProperties &&
		Object.keys(ctx.store.themeTweaks.cssProperties).length > 0;

	const disabled = () => !hasModifications() || !ctx.store.themeTweaksOn;

	const handleClick = () => {
		if (disabled()) return;
		setShowConfirm(true);
	};

	const handleConfirm = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		setShowConfirm(false);

		// Optimistic update for responsive UI
		ctx.setStore("themeTweaks", undefined);

		ContentScript.sendMessage("resetTweaks", undefined, currentTabId);
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
					disabled={disabled() || !ctx.isReady()}
					title={
						disabled()
							? "No tweaks to reset"
							: "Reset tweaks for this theme"
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
