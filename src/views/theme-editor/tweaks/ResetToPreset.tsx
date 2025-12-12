import { useDialogs } from "@/components/Dialog";
import { UndoIcon } from "@/components/icons/UndoIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";

export const ResetToPreset = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => {
		return (
			!ctx.store.tweaksOn ||
			!ctx.store.selectedPreset ||
			!ctx.store.hasUnsavedChanges
		);
	};

	const title = "Revert all unsaved changes";

	const handleRevert = async () => {
		const confirmed = await dialogs.confirm({
			title: `${title}?`,
			confirmText: "Revert",
			confirmType: "error",
		});

		if (confirmed && ctx.store.selectedPreset) {
			ctx.sendToContent("loadPreset", {
				presetName: ctx.store.selectedPreset,
			});
		}
	};

	return (
		<div class="tooltip" data-tip={title}>
			<button
				class="btn btn-xs btn-ghost btn-circle"
				onClick={handleRevert}
				disabled={disabled()}
			>
				<UndoIcon size={20} />
			</button>
		</div>
	);
};
