import { Show } from "solid-js";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { useHandleSaveAs } from "./useHandleSaveAs";

export const SaveButton = () => {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.hasUnsavedChanges;

	const handleSaveAs = useHandleSaveAs();

	const handleSave = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage("savePreset", undefined, currentTabId);
	};

	const handleClick = () => {
		if (ctx.store.selectedPreset) {
			handleSave();
		} else {
			handleSaveAs();
		}
	};

	const getTitle = () => {
		if (!ctx.store.tweaksOn) return "Enable tweaks to save";
		if (!ctx.store.hasUnsavedChanges) return "No unsaved changes";
		return `Save changes to "${ctx.store.selectedPreset}"`;
	};

	return (
		<div class="indicator">
			<Show when={!disabled()}>
				<span class="indicator-item status status-warning"></span>
			</Show>

			<button
				class="btn btn-xs btn-soft btn-warning"
				onClick={handleClick}
				disabled={disabled()}
				title={getTitle()}
			>
				Save Changes
			</button>
		</div>
	);
};
