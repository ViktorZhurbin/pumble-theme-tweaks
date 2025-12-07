import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { ResetIconButton } from "@/components/ResetIconButton";
import { Typography } from "@/components/Typography/Typography";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import styles from "./ResetButton.module.css";

export function ResetButton() {
	const ctx = useThemeEditorContext();
	const [showConfirm, setShowConfirm] = createSignal(false);

	const hasModifications = () => {
		const properties = Object.values(
			ctx.store.workingTweaks?.cssProperties ?? {},
		);

		return properties.some(
			(prop) => prop.value !== null && prop.value !== prop.initialValue,
		);
	};

	const disabled = () => !ctx.store.tweaksOn;

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		setShowConfirm(true);
	};

	const handleConfirm = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		setShowConfirm(false);

		// Optimistic update for responsive UI
		ctx.setStore("workingTweaks", { cssProperties: {} });
		ctx.setStore("selectedPreset", null);
		ctx.setStore("hasUnsavedChanges", false);

		ContentScript.sendMessage("resetWorkingTweaks", undefined, currentTabId);
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

	const title = "Reset theme to defaults";

	return (
		<Show when={hasModifications()}>
			<div class={styles.container}>
				<ResetIconButton
					class="btn-xs"
					onClick={handleClick}
					disabled={disabled()}
					title={disabled() ? "Tweaks disabled" : title}
				/>

				<Show when={showConfirm()}>
					<div class={styles.popover}>
						<div class={styles.popoverContent}>
							<Typography class={styles.confirmText}>{title}?</Typography>
							<div class={styles.confirmButtons}>
								<button class="btn btn-soft" onClick={handleCancel}>
									Cancel
								</button>
								<button class="btn btn-soft btn-error" onClick={handleConfirm}>
									Reset
								</button>
							</div>
						</div>
					</div>
				</Show>
			</div>
		</Show>
	);
}
