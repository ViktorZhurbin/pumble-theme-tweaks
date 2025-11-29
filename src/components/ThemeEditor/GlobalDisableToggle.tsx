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
				disabled={!ctx.isReady()}
				onClick={() => handleToggle(false)}
			>
				On
			</button>
			<button
				type="button"
				class={styles.toggleBtn}
				classList={{ [styles.toggleBtnActive]: ctx.store.isExtensionOff }}
				disabled={!ctx.isReady()}
				onClick={() => handleToggle(true)}
			>
				Off
			</button>
		</div>
	);
}
