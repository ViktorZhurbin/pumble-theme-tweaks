import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import {
	useDeleteDialog,
	useRenameDialog,
	useSaveAsDialog,
} from "./PresetActionsDropdown.hooks";

export function PresetActionsDropdown() {
	const ctx = useThemeEditorContext();
	const deleteDialog = useDeleteDialog();
	const renameDialog = useRenameDialog();
	const saveAsDialog = useSaveAsDialog();

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.selectedPreset;

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

	return (
		<div>
			<button
				class="btn btn-square btn-soft btn-sm"
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
				<li onClick={renameDialog.open}>
					<a>Rename</a>
				</li>
				<li onClick={handleExport}>
					<a>Export</a>
				</li>
				<li onClick={saveAsDialog.open}>
					<a>Save As</a>
				</li>
				<li class="text-error" onClick={deleteDialog.open}>
					<a>Delete</a>
				</li>
			</ul>

			{deleteDialog.Dialog()}
			{renameDialog.Dialog()}
			{saveAsDialog.Dialog()}
		</div>
	);
}
