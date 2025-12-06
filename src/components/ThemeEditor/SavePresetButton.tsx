import { Button } from "@/components/Button/Button";
import { ContentScript } from "@/entrypoints/content/messenger";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function SavePresetButton() {
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
		<Button
			variant="primary"
			onClick={handleClick}
			disabled={disabled()}
			title={getTitle()}
		>
			Save
		</Button>
	);
}
