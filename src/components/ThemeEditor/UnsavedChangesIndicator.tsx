import { Show } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import { useThemeEditorContext } from "./ThemeEditorContext";
import styles from "./UnsavedChangesIndicator.module.css";

export function UnsavedChangesIndicator() {
	const ctx = useThemeEditorContext();

	return (
		<Show when={ctx.store.hasUnsavedChanges}>
			<Typography class={styles.indicator} title="Unsaved changes">
				*
			</Typography>
		</Show>
	);
}
