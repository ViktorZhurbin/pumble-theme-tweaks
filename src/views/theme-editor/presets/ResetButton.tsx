import { useDialogs } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { buttonClass } from "./classes";

export const ResetButton = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const handleConfirm = () => {
		// Context-aware reset: reload preset if selected, otherwise clear
		if (ctx.store.selectedPreset) {
			// Reload the selected preset (revert to saved values)
			ctx.sendToContent("loadPreset", {
				presetName: ctx.store.selectedPreset,
			});
		} else {
			// No preset selected - clear everything (Pumble defaults)
			ctx.sendToContent("resetWorkingTweaks", undefined);
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
