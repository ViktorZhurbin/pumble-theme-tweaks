import { Show } from "solid-js";
import { useConfirmDialog } from "@/components/Dialog";
import { ResetIconButton } from "@/components/ResetIconButton";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

export function ResetButton() {
	const ctx = useThemeEditorContext();

	const hasModifications = () => {
		const properties = Object.values(
			ctx.store.workingTweaks?.cssProperties ?? {},
		);

		return properties.some(
			(prop) => prop.value !== null && prop.value !== prop.initialValue,
		);
	};

	const disabled = () => !ctx.store.tweaksOn;

	const handleConfirm = () => {
		const currentTabId = ctx.tabId();

		if (!currentTabId) return;

		// Optimistic update for responsive UI
		ctx.setStore("workingTweaks", { cssProperties: {} });
		ctx.setStore("selectedPreset", null);
		ctx.setStore("hasUnsavedChanges", false);

		ContentScript.sendMessage("resetWorkingTweaks", undefined, currentTabId);
	};

	const title = "Reset theme to defaults";

	const resetDialog = useConfirmDialog();

	const openResetDialog = () => {
		resetDialog.open({
			title,
			confirmText: "Reset",
			confirmType: "error",
			onConfirm: handleConfirm,
		});
	};

	return (
		<Show when={hasModifications()}>
			<ResetIconButton
				class="btn-xs"
				onClick={openResetDialog}
				disabled={disabled()}
				title={disabled() ? "Tweaks disabled" : title}
			/>

			{resetDialog.Dialog()}
		</Show>
	);
}
