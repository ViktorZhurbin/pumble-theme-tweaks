import { useDialogs } from "@/components/dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { buttonClass } from "./classes";

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

	const tooltip = () => (disabled() ? "" : "Create a new preset");

	return (
		<div class="tooltip" data-tip={tooltip()}>
			<button
				class={`${buttonClass} btn-primary`}
				onClick={handleNewPreset}
				disabled={disabled()}
			>
				+ New
			</button>
		</div>
	);
};
