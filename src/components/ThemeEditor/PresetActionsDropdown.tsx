import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./PresetActionsDropdown.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function PresetActionsDropdown() {
	const ctx = useThemeEditorContext();
	const [showMenu, setShowMenu] = createSignal(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.selectedPreset;

	const handleToggleMenu = () => {
		setShowMenu(!showMenu());
		setShowDeleteConfirm(false);
	};

	const handleDelete = async () => {
		const currentTabId = ctx.tabId();
		const presetName = ctx.store.selectedPreset;

		if (!currentTabId || !presetName) {
			logger.warn(
				"PresetActionsDropdown: Cannot delete without tab ID or preset",
			);
			return;
		}

		try {
			await ContentScript.sendMessage(
				"deletePreset",
				{ presetName },
				currentTabId,
			);
			setShowMenu(false);
			setShowDeleteConfirm(false);
		} catch (err) {
			logger.error("PresetActionsDropdown: Failed to delete preset", err);
		}
	};

	const handleExport = () => {
		const presetName = ctx.store.selectedPreset;
		if (!presetName) return;

		const preset = ctx.store.savedPresets[presetName];
		if (!preset) return;

		// Convert to exportable format (property names to values)
		const exportData: Record<string, string> = {};
		for (const [propertyName, entry] of Object.entries(preset.cssProperties)) {
			exportData[propertyName] = entry.value;
		}

		const json = JSON.stringify(exportData, null, 2);
		navigator.clipboard.writeText(json);

		setShowMenu(false);
	};

	// Close menu when clicking outside
	const handleClickOutside = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest(`.${styles.container}`)) {
			setShowMenu(false);
			setShowDeleteConfirm(false);
		}
	};

	// Add event listener when menu is open
	createEffect(() => {
		if (showMenu()) {
			document.addEventListener("click", handleClickOutside);
			onCleanup(() => {
				document.removeEventListener("click", handleClickOutside);
			});
		}
	});

	return (
		<div class={styles.container}>
			<button
				class="btn btn-square btn-soft"
				onClick={handleToggleMenu}
				disabled={disabled()}
				title={disabled() ? "Select a preset to see actions" : "Preset actions"}
			>
				•••
			</button>

			<Show when={showMenu()}>
				<div class={styles.menu}>
					<Show
						when={!showDeleteConfirm()}
						fallback={
							<div class={styles.confirmDelete}>
								<Typography variant="caption" class={styles.confirmText}>
									Delete "{ctx.store.selectedPreset}"?
								</Typography>
								<div class={styles.confirmButtons}>
									<button
										class="btn btn-soft btn-secondary"
										onClick={() => setShowDeleteConfirm(false)}
									>
										Cancel
									</button>
									<button class="btn btn-soft btn-error" onClick={handleDelete}>
										Delete
									</button>
								</div>
							</div>
						}
					>
						<button
							class={styles.menuItem}
							onClick={handleExport}
							type="button"
						>
							Export
						</button>
						<button
							class={`${styles.menuItem} ${styles.danger}`}
							onClick={() => setShowDeleteConfirm(true)}
							type="button"
						>
							Delete
						</button>
					</Show>
				</div>
			</Show>
		</div>
	);
}
