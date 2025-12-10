import { useDialogs } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { buttonClass } from "./classes";

export const NewPresetButton = () => {
	const ctx = useThemeEditorContext();

	const dialogs = useDialogs();

	const handleNewPreset = async () => {
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
		await ctx.sendToContent("resetWorkingTweaks", undefined);
	};

	return (
		<div class="tooltip" data-tip="Create a new preset">
			<button class={`${buttonClass} btn-primary`} onClick={handleNewPreset}>
				+ New
			</button>
		</div>
	);
};
