import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Button } from "@/components/Button/Button";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import styles from "./ResetButton.module.css";
import { ResetIconButton } from "./ResetIconButton";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function ResetButton() {
	const ctx = useThemeEditorContext();
	const [showConfirm, setShowConfirm] = createSignal(false);

	// Derive from context - disabled if no modifications or tweaks are off
	const hasModifications = () =>
		ctx.store.themeTweaks?.cssProperties &&
		Object.keys(ctx.store.themeTweaks.cssProperties).length > 0;

	const disabled = () => !hasModifications() || !ctx.store.themeTweaksOn;

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
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

	// Click outside handler
	createEffect(() => {
		if (!showConfirm()) return;

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// Check if click is outside the container
			if (!target.closest(`.${styles.container}`)) {
				setShowConfirm(false);
			}
		};

		// Small delay to prevent immediate close from button click
		setTimeout(() => {
			document.addEventListener("click", handleClickOutside);
		}, 0);

		onCleanup(() => {
			document.removeEventListener("click", handleClickOutside);
		});
	});

	return (
		<div class={styles.container}>
			<ResetIconButton
				class={styles.resetBtn}
				onClick={handleClick}
				disabled={disabled() || !ctx.isReady()}
				title={
					disabled() ? "No tweaks to reset" : "Reset tweaks for this theme"
				}
			/>

			<Show when={showConfirm()}>
				<div class={styles.popover}>
					<div class={styles.popoverContent}>
						<Typography class={styles.confirmText}>
							Reset all tweaks?
						</Typography>
						<div class={styles.confirmButtons}>
							<Button variant="secondary" onClick={handleCancel}>
								Cancel
							</Button>
							<Button variant="error" onClick={handleConfirm}>
								Reset
							</Button>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
