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
				class="btn btn-square btn-primary btn-sm"
				onClick={handleClick}
				disabled={disabled()}
				title={getTitle()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" />
					<path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
					<path d="M14 4l0 4l-6 0l0 -4" />
				</svg>
			</button>
		</div>
	);
}
