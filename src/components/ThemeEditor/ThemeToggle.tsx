import { ContentScript } from "@/entrypoints/content/messenger";
import { Checkbox } from "../Checkbox/Checkbox";
import { useThemeEditorContext } from "./ThemeEditorContext";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
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
		<div class={styles.wrapper}>
			<Checkbox
				title="Toggle all"
				disabled={false}
				checked={ctx.store.tweaksOn}
				onChange={handleChange}
			/>
		</div>
	);
}
