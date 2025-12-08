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
		<div class="tooltip" data-tip="Toggle all">
			<input
				type="checkbox"
				class="checkbox checkbox-primary checkbox-sm"
				disabled={false}
				checked={ctx.store.tweaksOn}
				onChange={handleChange}
			/>
		</div>
	);
};
