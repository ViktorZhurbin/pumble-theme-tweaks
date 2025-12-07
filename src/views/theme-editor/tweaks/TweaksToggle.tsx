import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";

export const TweaksToggle = () => {
	const ctx = useThemeEditorContext();

	const handleChange = (e: Event) => {
		const checked = (e.target as HTMLInputElement).checked;
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"setTweaksOn",
			{ enabled: checked },
			currentTabId,
		);
	};

	return (
		<input
			type="checkbox"
			class="checkbox checkbox-primary checkbox-sm"
			title="Toggle all"
			disabled={false}
			checked={ctx.store.tweaksOn}
			onChange={handleChange}
		/>
	);
};
