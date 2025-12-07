import { For } from "solid-js";
import { useConfirmDialog } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export function PresetSelector() {
	const ctx = useThemeEditorContext();
	const confirmDialog = useConfirmDialog();

	const disabled = () => !ctx.store.tweaksOn;

	const handleChange = async (e: Event) => {
		const select = e.target as HTMLSelectElement;
		const value = select.value;
		const currentTabId = ctx.tabId();

		if (!currentTabId) {
			logger.warn("PresetSelector: No tab ID available");
			return;
		}

		// Check for unsaved changes
		if (ctx.store.hasUnsavedChanges) {
			// Show confirmation dialog
			confirmDialog.open({
				title: "You have unsaved changes. Switch preset anyway?",
				confirmText: "Switch",
				confirmType: "primary",
				onConfirm: async () => {
					await loadPreset(value, currentTabId);
				},
			});
			// Reset select to current value (will update after confirmation)
			select.value = ctx.store.selectedPreset ?? "";
			return;
		}

		// No unsaved changes, proceed with load
		await loadPreset(value, currentTabId);
	};

	const loadPreset = async (value: string, currentTabId: number) => {
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
		<>
			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Preset</legend>
				<select
					class="select"
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

			{confirmDialog.Dialog()}
		</>
	);
}
