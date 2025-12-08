import { For } from "solid-js";
import { useDialogs } from "@/components/dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { PresetDropdown } from "./PresetDropdown";

export const PresetSelector = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

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
			// Reset select to current value first (will update after confirmation)
			select.value = ctx.store.selectedPreset ?? "";

			// Show confirmation dialog
			const confirmed = await dialogs.confirm({
				title: "You have unsaved changes. Switch preset anyway?",
				confirmText: "Switch",
				confirmType: "primary",
			});

			if (confirmed) {
				await loadPreset(value, currentTabId);
			}
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
		<fieldset class="fieldset ">
			<legend class="fieldset-legend">Preset</legend>
			<div class="flex items-center gap-2.5">
				<select
					class="select bg-base-300"
					value={ctx.store.selectedPreset ?? ""}
					onChange={handleChange}
					disabled={disabled()}
				>
					<option value="" class="opacity-50">
						None
					</option>
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

				<PresetDropdown />
			</div>
		</fieldset>
	);
};
