import { useDialogs } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { validatePresetName } from "@/lib/validate";

export const useHandleSaveAs = () => {
	const dialogs = useDialogs();
	const ctx = useThemeEditorContext();

	const handleSaveAs = async () => {
		const currentTabId = ctx.tabId();

		if (!currentTabId) return;

		const name = await dialogs.input({
			title: "Save Preset As",
			placeholder: "Enter preset name",
			confirmText: "Save",
			validate: (value) => validatePresetName(value, ctx.store.savedPresets),
		});

		if (name) {
			try {
				await ContentScript.sendMessage(
					"savePresetAs",
					{ presetName: name },
					currentTabId,
				);
			} catch (err) {
				logger.error("SaveButton: Failed to save preset", err);
			}
		}
	};

	return handleSaveAs;
};
