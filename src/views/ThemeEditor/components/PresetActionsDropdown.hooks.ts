import { useConfirmDialog, useInputDialog } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export const useRenameDialog = () => {
	const ctx = useThemeEditorContext();

	const renameDialog = useInputDialog();

	const openRenameDialog = () => {
		const currentTabId = ctx.tabId();
		const oldName = ctx.store.selectedPreset;

		if (!currentTabId || !oldName) return;

		const handleRename = async (newName: string): Promise<void> => {
			if (newName === oldName) return; // No change, just close

			try {
				await ContentScript.sendMessage(
					"renamePreset",
					{ oldName, newName },
					currentTabId,
				);
			} catch (err) {
				logger.error("PresetActionsDropdown: Failed to rename preset", err);
				throw err;
			}
		};

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
			onConfirm: handleRename,
		});
	};

	return { ...renameDialog, open: openRenameDialog };
};

export const useSaveAsDialog = () => {
	const ctx = useThemeEditorContext();

	const saveAsDialog = useInputDialog();

	const openSaveAsDialog = () => {
		const currentTabId = ctx.tabId();
		const oldName = ctx.store.selectedPreset;

		if (!currentTabId || !oldName) return;

		const handleSaveAs = async (name: string) => {
			try {
				await ContentScript.sendMessage(
					"savePresetAs",
					{ presetName: name },
					currentTabId,
				);
			} catch (err) {
				logger.error("Failed to save preset", err);
				throw err; // Re-throw to prevent dialog from closing
			}
		};

		saveAsDialog.open({
			title: "Save Preset As",
			placeholder: "Enter preset name",
			confirmText: "Save",
			validate: (value) => {
				if (!value.trim()) return "Preset name cannot be empty";
				if (ctx.store.savedPresets[value])
					return `Preset "${value}" already exists`;
				return null;
			},
			onConfirm: handleSaveAs,
		});
	};

	return { ...saveAsDialog, open: openSaveAsDialog };
};

export const useDeleteDialog = () => {
	const ctx = useThemeEditorContext();

	const deleteDialog = useConfirmDialog();

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

	return { ...deleteDialog, open: openDeleteDialog };
};
