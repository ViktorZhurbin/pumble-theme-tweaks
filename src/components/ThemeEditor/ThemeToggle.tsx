import { ContentScript } from "@/entrypoints/content/messenger";
import { useThemeEditorContext } from "./ThemeEditorContext";
import styles from "./ThemeToggle.module.css";
import { ToggleCheckbox } from "./ToggleCheckbox";

export function ThemeToggle() {
	const ctx = useThemeEditorContext();

	const handleChange = (e: Event) => {
		const checked = (e.target as HTMLInputElement).checked;
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"toggleTweaks",
			{ enabled: checked },
			currentTabId,
		);
	};

	return (
		<div class={styles.wrapper}>
			<ToggleCheckbox
				title="Toggle all"
				disabled={ctx.store.isExtensionOff || !ctx.isReady()}
				checked={ctx.store.themeTweaksOn}
				onChange={handleChange}
			/>
		</div>
	);
}
