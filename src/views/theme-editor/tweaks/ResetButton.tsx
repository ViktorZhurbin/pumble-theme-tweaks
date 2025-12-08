import { Show } from "solid-js";
import { useDialogs } from "@/components/dialog";
import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

export const ResetButton = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

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

	const handleReset = async () => {
		const confirmed = await dialogs.confirm({
			title,
			confirmText: "Reset",
			confirmType: "error",
		});

		if (confirmed) {
			handleConfirm();
		}
	};

	return (
		<Show when={hasModifications()}>
			<button
				class="btn btn-xs btn-neutral btn-circle"
				onClick={handleReset}
				disabled={disabled()}
				title={disabled() ? "Tweaks disabled" : title}
			>
				<ResetIcon />
			</button>
		</Show>
	);
};
