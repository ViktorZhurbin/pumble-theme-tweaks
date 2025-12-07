import { Show } from "solid-js";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

export function SaveButton() {
	const ctx = useThemeEditorContext();

	const disabled = () =>
		!ctx.store.tweaksOn ||
		!ctx.store.selectedPreset ||
		!ctx.store.hasUnsavedChanges;

	const handleClick = () => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage("savePreset", undefined, currentTabId);
	};

	const getTitle = () => {
		if (!ctx.store.tweaksOn) return "Enable tweaks to save";
		if (!ctx.store.selectedPreset) return "Select a preset to save changes";
		if (!ctx.store.hasUnsavedChanges) return "No unsaved changes";
		return `Save changes to "${ctx.store.selectedPreset}"`;
	};

	return (
		<div class="indicator">
			<Show when={ctx.store.hasUnsavedChanges}>
				<span class="indicator-item status status-success status-md"></span>
			</Show>

			<button
				class="btn btn-primary"
				onClick={handleClick}
				disabled={disabled()}
				title={getTitle()}
			>
				Save
			</button>
		</div>
	);
}
