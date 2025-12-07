import { useConfirmDialog, useInputDialog } from "@/components/Dialog";
import type { DropdownItem } from "@/components/Dropdown";
import { Dropdown } from "@/components/Dropdown";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import {
	getExportJson,
	getScriptString,
	parseImportJSON,
	validateImport,
} from "@/lib/import-export";
import { logger } from "@/lib/logger";

export const PresetDropdown = () => {
	const ctx = useThemeEditorContext();

	const deleteDialog = useConfirmDialog();
	const renameDialog = useInputDialog();
	const saveAsDialog = useInputDialog();
	const importDialog = useInputDialog();

	const disabled = () => !ctx.tabId() || !ctx.store.tweaksOn;

	// === Export Handlers ===

	const handleExport = () => {
		const json = getExportJson(ctx.store.workingTweaks);

		navigator.clipboard.writeText(json);
	};

	const handleCopyScript = () => {
		const script = getScriptString(ctx.store.workingTweaks);

		navigator.clipboard.writeText(script);
	};

	// === Preset Management ===

	const openDeleteDialog = () => {
		const presetName = ctx.store.selectedPreset;
		if (!presetName) return;

		deleteDialog.open({
			title: `Delete "${presetName}"?`,
			confirmText: "Delete",
			confirmType: "error",
			onConfirm: async () => {
				const currentTabId = ctx.tabId();
				if (!currentTabId || !presetName) {
					logger.warn(
						"PresetDropdown: Cannot delete without tab ID or preset",
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
					logger.error("PresetDropdown: Failed to delete preset", err);
					throw err;
				}
			},
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
			validate: (value) =>
				validatePresetName(value, ctx.store.savedPresets, oldName),
			onConfirm: async (newName) => {
				if (newName === oldName) return;

				try {
					await ContentScript.sendMessage(
						"renamePreset",
						{ oldName, newName },
						currentTabId,
					);
				} catch (err) {
					logger.error("PresetDropdown: Failed to rename preset", err);
					throw err;
				}
			},
		});
	};

	const openSaveAsDialog = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		saveAsDialog.open({
			title: "Save Preset As",
			placeholder: "Enter preset name",
			confirmText: "Save",
			validate: (value) => validatePresetName(value, ctx.store.savedPresets),
			onConfirm: async (name) => {
				try {
					await ContentScript.sendMessage(
						"savePresetAs",
						{ presetName: name },
						currentTabId,
					);
				} catch (err) {
					logger.error("PresetDropdown: Failed to save preset", err);
					throw err;
				}
			},
		});
	};

	// === Import Handlers ===

	const handleImport = async (value: string) => {
		const parsed = parseImportJSON(value) as Record<string, string>;

		try {
			const currentTabId = ctx.tabId();
			if (!currentTabId) {
				logger.warn("PresetDropdown: No tab ID available");
				return;
			}

			for (const [propertyName, value] of Object.entries(parsed)) {
				await ContentScript.sendMessage(
					"updateWorkingProperty",
					{ propertyName, value },
					currentTabId,
				);
			}

			logger.debug("PresetDropdown: Import successful", {
				count: Object.keys(parsed).length,
			});
		} catch (err) {
			logger.error("PresetDropdown: Import failed", err);
			throw err;
		}
	};

	const openImportDialog = () => {
		importDialog.open({
			type: "textarea",
			title: "Import preset",
			placeholder:
				'Paste theme JSON (e.g., {"--palette-primary-main":"#FF5733"})',
			confirmText: "Import",
			onConfirm: handleImport,
			validate: validateImport,
		});
	};

	// === Menu Items ===

	const items = (): DropdownItem[] => [
		{
			label: "Rename",
			onClick: openRenameDialog,
			disabled: !ctx.store.selectedPreset,
		},
		{
			label: "Copy",
			onClick: handleExport,
		},
		{
			label: "Copy Script",
			onClick: handleCopyScript,
		},
		{
			label: "Import",
			onClick: openImportDialog,
		},
		{
			label: "Save As",
			onClick: openSaveAsDialog,
		},
		{
			label: "Delete",
			onClick: openDeleteDialog,
			disabled: !ctx.store.selectedPreset,
			variant: "error",
		},
	];

	return (
		<>
			<Dropdown
				trigger={{
					content: "•••",
					class: "btn btn-square btn-soft btn-sm",
					disabled: disabled(),
				}}
				items={items()}
				positionX="end"
			/>

			{deleteDialog.Dialog()}
			{renameDialog.Dialog()}
			{saveAsDialog.Dialog()}
			{importDialog.Dialog()}
		</>
	);
};

// === Helpers ===

function validatePresetName(
	name: string,
	savedPresets: Record<string, unknown>,
	existingName?: string,
): string | null {
	if (!name.trim()) return "Preset name cannot be empty";
	if (existingName && name === existingName) return null;
	if (savedPresets[name]) return `Preset "${name}" already exists`;
	return null;
}
