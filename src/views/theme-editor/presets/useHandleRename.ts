import { useDialogs } from "@/components/dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { validatePresetName } from "@/lib/validate";

export const useHandleRename = () => {
	const dialogs = useDialogs();
	const ctx = useThemeEditorContext();

	const handleRename = async (oldName: string) => {
		const currentTabId = ctx.tabId();

		if (!currentTabId) return;

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

	return handleRename;
};
