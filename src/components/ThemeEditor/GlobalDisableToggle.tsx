import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import styles from "./GlobalDisableToggle.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function GlobalDisableToggle() {
	const ctx = useThemeEditorContext();

	const handleToggle = (newDisabled: boolean) => {
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"toggleGlobal",
			{ disabled: newDisabled },
			currentTabId,
		);
	};

	return (
		<div class={styles.toggle}>
			<button
				type="button"
				class={styles.toggleBtn}
				classList={{ [styles.toggleBtnActive]: !ctx.store.isExtensionOff }}
				onClick={() => handleToggle(false)}
			>
				<Typography variant="caption">On</Typography>
			</button>
			<button
				type="button"
				class={styles.toggleBtn}
				classList={{ [styles.toggleBtnActive]: ctx.store.isExtensionOff }}
				onClick={() => handleToggle(true)}
			>
				<Typography variant="caption">Off</Typography>
			</button>
		</div>
	);
}
