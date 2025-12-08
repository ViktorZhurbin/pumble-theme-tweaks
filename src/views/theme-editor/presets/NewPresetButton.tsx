import { useDialogs } from "@/components/dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export const NewPresetButton = () => {
	const ctx = useThemeEditorContext();

	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;

	const handleNewPreset = async () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) {
			logger.warn("NewPresetButton: No tab ID available");
			return;
		}

		// Check for unsaved changes before clearing
		if (ctx.store.hasUnsavedChanges) {
			const confirmed = await dialogs.confirm({
				title: "You have unsaved changes. Start from scratch anyway?",
				confirmText: "Start New",
				confirmType: "primary",
			});

			if (!confirmed) return;
		}

		// Reset working tweaks to start fresh
		await ContentScript.sendMessage(
			"resetWorkingTweaks",
			undefined,
			currentTabId,
		);
	};

	return (
		<button
			class="btn btn-xs btn-soft btn-primary"
			onClick={handleNewPreset}
			disabled={disabled()}
			title={
				disabled()
					? "Enable tweaks to create a new preset"
					: "Start a new preset from scratch"
			}
		>
			+ New
		</button>
	);
};
