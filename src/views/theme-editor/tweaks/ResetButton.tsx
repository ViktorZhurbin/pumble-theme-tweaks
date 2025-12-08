import { useDialogs } from "@/components/dialog";
import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

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

	const getTitle = () => {
		if (ctx.store.selectedPreset) {
			return `Reset to "${ctx.store.selectedPreset}" preset values`;
		}
		return "Reset all colors to Pumble defaults";
	};

	const handleReset = async () => {
		const confirmed = await dialogs.confirm({
			title: getTitle(),
			confirmText: "Reset",
			confirmType: "error",
		});

		if (confirmed) {
			handleConfirm();
		}
	};

	const getTooltip = () => {
		if (!ctx.store.tweaksOn) return "Enable tweaks to reset colors";
		if (!ctx.store.hasUnsavedChanges) return "No changes to reset";
		return getTitle();
	};

	return (
		<button
			class="btn btn-xs btn-ghost btn-circle"
			onClick={handleReset}
			disabled={!ctx.store.tweaksOn || !ctx.store.hasUnsavedChanges}
			title={getTooltip()}
		>
			<ResetIcon />
		</button>
	);
};
