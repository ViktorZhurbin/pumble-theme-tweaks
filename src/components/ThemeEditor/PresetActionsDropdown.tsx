import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./PresetActionsDropdown.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function PresetActionsDropdown() {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.selectedPreset;

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
	};

	let dialog!: HTMLDialogElement;

	return (
		<div>
			<button
				class="btn btn-square btn-soft"
				popoverTarget="preset-actions-popover"
				style={{ "anchor-name": "--anchor-1" }}
				disabled={disabled()}
				title={disabled() ? "Select a preset to see actions" : "Preset actions"}
			>
				•••
			</button>

			<ul
				class="dropdown menu bg-base-100 shadow-sm"
				popover="auto"
				id="preset-actions-popover"
				style={{ "position-anchor": "--anchor-1" }}
			>
				<li onClick={handleExport}>
					<a>Export</a>
				</li>
				<li class="text-error" onClick={() => dialog.showModal()}>
					<a>Delete</a>
				</li>
			</ul>

			<dialog id="my_modal_1" class="modal" ref={dialog}>
				<div class="modal-box">
					<Typography variant="caption" class={styles.confirmText}>
						Delete "{ctx.store.selectedPreset}"?
					</Typography>
					<div class="modal-action">
						<form method="dialog">
							<button class="btn btn-soft btn-secondary">Cancel</button>
							<button class="btn btn-soft btn-error" onClick={handleDelete}>
								Delete
							</button>
						</form>
					</div>
				</div>
			</dialog>
		</div>
	);
}
