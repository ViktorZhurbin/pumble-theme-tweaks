import { useDialogs } from "@/components/Dialog";
import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { headerButtonClasses } from "../classes";

export const ResetToDefaults = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;
	const visible = () =>
		!!ctx.store.selectedPreset && ctx.store.hasUnsavedChanges;

	const getTitle = () => {
		if (ctx.store.hasUnsavedChanges) {
			return "Discards unsaved changes & start a new preset";
		}

		return "Start a new preset";
	};

	const reset = () => {
		ctx.sendToContent("resetWorkingTweaks", undefined);
	};

	const handleReset = async () => {
		const confirmed = await dialogs.confirm({
			title: `${getTitle()}?`,
			confirmText: "Yes",
			confirmType: ctx.store.hasUnsavedChanges ? "error" : "primary",
		});

		if (confirmed) {
			reset();
		}
	};

	return (
		<div
			class="tooltip"
			data-tip={getTitle()}
			classList={{ invisible: !visible() }}
		>
			<button
				disabled={disabled()}
				class={headerButtonClasses}
				onClick={handleReset}
			>
				<ResetIcon size={20} />
			</button>
		</div>
	);
};
