import { For, Show } from "solid-js";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./PresetSelector.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function PresetSelector() {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn;

	const handleChange = async (e: Event) => {
		const select = e.target as HTMLSelectElement;
		const value = select.value;
		const currentTabId = ctx.tabId();

		if (!currentTabId) {
			logger.warn("PresetSelector: No tab ID available");
			return;
		}

		if (value === "") {
			// User selected "No Preset Selected" - reset working tweaks
			await ContentScript.sendMessage(
				"resetWorkingTweaks",
				undefined,
				currentTabId,
			);
		} else {
			// Load the selected preset
			await ContentScript.sendMessage(
				"loadPreset",
				{ presetName: value },
				currentTabId,
			);
		}
	};

	const presetNames = () => Object.keys(ctx.store.savedPresets).sort();

	return (
		<div class={styles.container}>
			<div class={styles.selectorWrapper}>
				<fieldset class="fieldset w-full">
					<legend class="fieldset-legend">Preset</legend>
					<select
						class="select select-sm"
						value={ctx.store.selectedPreset ?? ""}
						onChange={handleChange}
						disabled={disabled()}
					>
						<option value="">No Preset Selected</option>
						<For each={presetNames()}>
							{(presetName) => (
								<option
									value={presetName}
									selected={presetName === ctx.store.selectedPreset}
								>
									{presetName}
								</option>
							)}
						</For>
					</select>
				</fieldset>
				<Show when={ctx.store.hasUnsavedChanges}>
					<span class="status status-info"></span>
				</Show>
			</div>
		</div>
	);
}
