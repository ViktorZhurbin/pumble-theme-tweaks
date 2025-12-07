import { useConfirmDialog, useInputDialog } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export function PresetActionsDropdown() {
	const ctx = useThemeEditorContext();
	const deleteDialog = useConfirmDialog();
	const renameDialog = useInputDialog();

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
			throw err; // Re-throw to prevent dialog from closing
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

	const openDeleteDialog = () => {
		const presetName = ctx.store.selectedPreset;
		if (!presetName) return;

		deleteDialog.open({
			title: `Delete "${presetName}"?`,
			confirmText: "Delete",
			confirmType: "error",
			onConfirm: handleDelete,
		});
	};

	const openRenameDialog = () => {
		const currentTabId = ctx.tabId();
		const oldName = ctx.store.selectedPreset;

		if (!currentTabId || !oldName) return;

		renameDialog.open({
			title: `Rename "${oldName}"`,
			placeholder: "Enter new name",
			defaultValue: oldName,
			confirmText: "Rename",
			validate: (value) => {
				if (!value.trim()) return "Preset name cannot be empty";
				if (value === oldName) return null; // Same name, just close
				if (ctx.store.savedPresets[value])
					return `Preset "${value}" already exists`;
				return null;
			},
			onConfirm: async (newName) => {
				if (newName === oldName) return; // No change, just close

				try {
					await ContentScript.sendMessage(
						"renamePreset",
						{ oldName, newName },
						currentTabId,
					);
				} catch (err) {
					logger.error("PresetActionsDropdown: Failed to rename preset", err);
					throw err; // Re-throw to prevent dialog from closing
				}
			},
		});
	};

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
				<li onClick={openRenameDialog}>
					<a>Rename</a>
				</li>
				<li onClick={handleExport}>
					<a>Export</a>
				</li>
				<li class="text-error" onClick={openDeleteDialog}>
					<a>Delete</a>
				</li>
			</ul>

			{deleteDialog.Dialog()}
			{renameDialog.Dialog()}
		</div>
	);
}
