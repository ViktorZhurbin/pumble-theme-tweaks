import { useDialogs } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { buttonClass } from "./classes";

export const ResetButton = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const handleConfirm = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		// Context-aware reset: reload preset if selected, otherwise clear
		if (ctx.store.selectedPreset) {
			// Reload the selected preset (revert to saved values)
			ContentScript.sendMessage(
				"loadPreset",
				{ presetName: ctx.store.selectedPreset },
				currentTabId,
			);
		} else {
			// No preset selected - clear everything (Pumble defaults)
			ContentScript.sendMessage("resetWorkingTweaks", undefined, currentTabId);
		}
	};

	const title = "Reset unsaved changes";

	const handleReset = async () => {
		const confirmed = await dialogs.confirm({
			title: `${title}?`,
			confirmText: "Reset",
			confirmType: "error",
		});

		if (confirmed) {
			handleConfirm();
		}
	};

	return (
		<div class="tooltip" data-tip={title}>
			<button
				class={`${buttonClass} btn-error`}
				onClick={handleReset}
				disabled={!ctx.store.tweaksOn || !ctx.store.hasUnsavedChanges}
			>
				Reset
			</button>
		</div>
	);
};
