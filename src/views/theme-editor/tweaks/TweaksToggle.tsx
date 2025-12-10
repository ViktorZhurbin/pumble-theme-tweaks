import { useThemeEditorContext } from "@/context/ThemeEditorContext";

export const TweaksToggle = () => {
	const ctx = useThemeEditorContext();

	const handleChange = (e: Event) => {
		const checked = (e.target as HTMLInputElement).checked;

		ctx.sendToContent("setTweaksOn", { enabled: checked });
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
