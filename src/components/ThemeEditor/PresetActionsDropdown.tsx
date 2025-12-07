import { createSignal } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./PresetActionsDropdown.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function PresetActionsDropdown() {
	const ctx = useThemeEditorContext();
	const [newName, setNewName] = createSignal("");
	const [renameError, setRenameError] = createSignal<string | null>(null);

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.selectedPreset;

	let deleteDialog!: HTMLDialogElement;
	let renameDialog!: HTMLDialogElement;
	let renameInputRef: HTMLInputElement | undefined;

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
			deleteDialog.close();
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

	const openRenameDialog = () => {
		setNewName(ctx.store.selectedPreset ?? "");
		setRenameError(null);
		renameDialog.showModal();
		setTimeout(() => renameInputRef?.focus(), 0);
	};

	const handleRename = async () => {
		const currentTabId = ctx.tabId();
		const oldName = ctx.store.selectedPreset;
		const trimmedNewName = newName().trim();

		if (!currentTabId || !oldName) {
			logger.warn("PresetActionsDropdown: Cannot rename without tab ID or preset");
			return;
		}

		if (!trimmedNewName) {
			setRenameError("Preset name cannot be empty");
			return;
		}

		if (trimmedNewName === oldName) {
			renameDialog.close();
			return;
		}

		if (ctx.store.savedPresets[trimmedNewName]) {
			setRenameError(`Preset "${trimmedNewName}" already exists`);
			return;
		}

		try {
			await ContentScript.sendMessage(
				"renamePreset",
				{ oldName, newName: trimmedNewName },
				currentTabId,
			);
			renameDialog.close();
		} catch (err) {
			logger.error("PresetActionsDropdown: Failed to rename preset", err);
			setRenameError("Failed to rename preset");
		}
	};

	const handleRenameKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			handleRename();
		} else if (e.key === "Escape") {
			renameDialog.close();
		}
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
				<li class="text-error" onClick={() => deleteDialog.showModal()}>
					<a>Delete</a>
				</li>
			</ul>

			{/* Rename Dialog */}
			<dialog class="modal" ref={renameDialog}>
				<div class="modal-box">
					<Typography variant="caption">
						Rename "{ctx.store.selectedPreset}"
					</Typography>
					<input
						ref={renameInputRef}
						type="text"
						class="input input-bordered w-full mt-4"
						placeholder="Enter new name"
						value={newName()}
						onInput={(e) => {
							setNewName(e.currentTarget.value);
							setRenameError(null);
						}}
						onKeyDown={handleRenameKeyDown}
					/>
					{renameError() && (
						<Typography variant="caption" class="text-error mt-2">
							{renameError()}
						</Typography>
					)}
					<div class="modal-action">
						<form method="dialog">
							<button class="btn btn-soft btn-secondary">Cancel</button>
							<button
								type="button"
								class="btn btn-soft btn-primary"
								onClick={handleRename}
								disabled={!newName().trim()}
							>
								Rename
							</button>
						</form>
					</div>
				</div>
			</dialog>

			{/* Delete Dialog */}
			<dialog class="modal" ref={deleteDialog}>
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
