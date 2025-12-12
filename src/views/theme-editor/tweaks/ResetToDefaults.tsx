import { useDialogs } from "@/components/Dialog";
import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";

export const ResetToDefaults = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;

	const title = "Reset to current Pumble theme defaults";

	const handleReset = async () => {
		const confirmed = await dialogs.confirm({
			title: `${title}?`,
			confirmText: "Reset",
			confirmType: "error",
		});

		if (confirmed) {
			ctx.sendToContent("resetWorkingTweaks", undefined);
		}
	};

	return (
		<div class="tooltip" data-tip={title}>
			<button
				class="btn btn-xs btn-ghost btn-circle"
				onClick={handleReset}
				disabled={disabled()}
			>
				<ResetIcon size={20} />
			</button>
		</div>
	);
};
