import { useDialogs } from "@/components/Dialog";
import type { DropdownItem } from "@/components/Dropdown";
import { Dropdown } from "@/components/Dropdown";
import { useNotifications } from "@/components/notification";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import {
	getExportJson,
	getScriptString,
	parseImportJSON,
	validateImport,
} from "@/lib/import-export";
import { logger } from "@/lib/logger";
import { validatePresetName } from "@/lib/validate";

export const PresetMenu = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();
	const notifications = useNotifications();

	const disabled = () => !ctx.tabId() || !ctx.store.tweaksOn;

	// === Export Handlers ===

	const handleExport = () => {
		const json = getExportJson(ctx.store.workingTweaks);

		navigator.clipboard.writeText(json);
		notifications.success("Preset copied to clipboard. You can share it now!");
	};

	const handleCopyScript = () => {
		const script = getScriptString(ctx.store.workingTweaks);

		navigator.clipboard.writeText(script);
		notifications.success(
			"Script copied to clipboard! Paste and run it in the DevTools console of Pumble desktop app",
			7000,
		);
	};

	// === Preset Management ===

	const handleDelete = async () => {
		const presetName = ctx.store.selectedPreset;
		const currentTabId = ctx.tabId();

		if (!currentTabId || !presetName) {
			logger.warn("PresetDropdown: Cannot delete without tab ID or preset");
			return;
		}

		const confirmed = await dialogs.confirm({
			title: `Delete "${presetName}"?`,
			confirmText: "Delete",
			confirmType: "error",
		});

		if (confirmed) {
			try {
				await ContentScript.sendMessage(
					"deletePreset",
					{ presetName },
					currentTabId,
				);
			} catch (err) {
				logger.error("PresetDropdown: Failed to delete preset", err);
			}
		}
	};

	const handleRename = async () => {
		const currentTabId = ctx.tabId();
		const oldName = ctx.store.selectedPreset;

		if (!currentTabId || !oldName) return;

		const newName = await dialogs.input({
			title: `Rename "${oldName}"`,
			placeholder: "Enter new name",
			defaultValue: oldName,
			confirmText: "Rename",
			validate: (value) =>
				validatePresetName(value, ctx.store.savedPresets, oldName),
		});

		if (newName && newName !== oldName) {
			try {
				await ContentScript.sendMessage(
					"renamePreset",
					{ oldName, newName },
					currentTabId,
				);
			} catch (err) {
				logger.error("PresetDropdown: Failed to rename preset", err);
			}
		}
	};

	const handleImport = async (value: string) => {
		try {
			const currentTabId = ctx.tabId();
			if (!currentTabId) {
				logger.warn("PresetDropdown: No tab ID available");
				return;
			}

			const cssProperties = parseImportJSON(value);

			if (!cssProperties) {
				logger.warn("PresetDropdown: Import failed");
				return;
			}

			await ContentScript.sendMessage(
				"importPreset",
				{ cssProperties },
				currentTabId,
			);

			logger.debug("PresetDropdown: Import successful", {
				count: Object.keys(cssProperties).length,
			});
		} catch (err) {
			logger.error("PresetDropdown: Import failed", err);
			throw err;
		}
	};

	const handleImportDialog = async () => {
		const value = await dialogs.input({
			type: "textarea",
			title: "Import preset",
			placeholder:
				'Paste theme JSON (e.g., {"--palette-primary-main":"#FF5733"})',
			confirmText: "Import",
			validate: validateImport,
		});

		if (value) {
			await handleImport(value);
		}
	};

	// === Menu Items ===

	const items = (): DropdownItem[] => [
		// Preset Management
		{
			type: "item",
			label: "Rename",
			onClick: handleRename,
			disabled: !ctx.store.selectedPreset,
		},
		{ type: "divider" },
		// Import/Export
		{
			type: "item",
			label: "Share",
			onClick: handleExport,
		},
		{
			type: "item",
			label: "Copy Script",
			onClick: handleCopyScript,
		},
		{
			type: "item",
			label: "Import",
			onClick: handleImportDialog,
		},
		{ type: "divider" },
		// Destructive Actions
		{
			type: "item",
			label: "Delete",
			onClick: handleDelete,
			disabled: !ctx.store.selectedPreset,
			variant: "error",
		},
	];

	return (
		<Dropdown
			trigger={{
				content: "•••",
				class: "btn btn-square btn-soft btn-sm",
				disabled: disabled(),
			}}
			items={items()}
		/>
	);
};
