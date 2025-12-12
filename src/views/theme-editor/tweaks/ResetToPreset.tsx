import { useDialogs } from "@/components/Dialog";
import { UndoIcon } from "@/components/icons/UndoIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { headerButtonClasses } from "./classes";

export const ResetToPreset = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => {
		return !ctx.store.tweaksOn || !ctx.store.hasUnsavedChanges;
	};

	const title = "Discard all unsaved changes";

	const reset = () => {
		if (ctx.store.selectedPreset) {
			ctx.sendToContent("loadPreset", {
				presetName: ctx.store.selectedPreset,
			});
		}
	};

	const handleRevert = async () => {
		if (!ctx.store.hasUnsavedChanges) {
			reset();
		}

		const confirmed = await dialogs.confirm({
			title: `${title}?`,
			confirmText: "Yes",
			confirmType: "error",
		});

		if (confirmed) {
			reset();
		}
	};

	return (
		<div class="tooltip" data-tip={title}>
			<button
				class={headerButtonClasses}
				onClick={handleRevert}
				disabled={disabled()}
			>
				<UndoIcon size={20} />
			</button>
		</div>
	);
};
