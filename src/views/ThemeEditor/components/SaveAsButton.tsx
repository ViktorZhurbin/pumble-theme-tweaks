import { useInputDialog } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export function SaveAsButton() {
	const ctx = useThemeEditorContext();
	const inputDialog = useInputDialog();

	const disabled = () => !ctx.store.tweaksOn;

	const openDialog = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) {
			logger.warn("SavePresetAsButton: No tab ID available");
			return;
		}

		inputDialog.open({
			title: "Save Preset As",
			placeholder: "Enter preset name",
			confirmText: "Save",
			validate: (value) => {
				if (!value.trim()) return "Preset name cannot be empty";
				if (ctx.store.savedPresets[value])
					return `Preset "${value}" already exists`;
				return null;
			},
			onConfirm: async (name) => {
				try {
					await ContentScript.sendMessage(
						"savePresetAs",
						{ presetName: name },
						currentTabId,
					);
				} catch (err) {
					logger.error("SavePresetAsButton: Failed to save preset", err);
					throw err; // Re-throw to prevent dialog from closing
				}
			},
		});
	};

	return (
		<>
			<button
				class="btn btn-secondary"
				onClick={openDialog}
				disabled={disabled()}
				title={disabled() ? "Enable tweaks to save" : "Save as new preset"}
			>
				Save As...
			</button>

			{inputDialog.Dialog()}
		</>
	);
}
