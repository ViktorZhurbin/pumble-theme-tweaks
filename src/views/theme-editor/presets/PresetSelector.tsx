import { For } from "solid-js";
import { useDialogs } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { PresetMenu } from "./PresetMenu";

export const PresetSelector = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;

	const handleChange = async (e: Event) => {
		const select = e.target as HTMLSelectElement;
		const value = select.value;

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
				await loadPreset(value);
			}
			return;
		}

		// No unsaved changes, proceed with load
		await loadPreset(value);
	};

	const loadPreset = async (value: string) => {
		if (value === "") {
			// User selected "No Preset Selected" - reset working tweaks
			await ctx.sendToContent("resetWorkingTweaks", undefined);
		} else {
			// Load the selected preset
			await ctx.sendToContent("loadPreset", { presetName: value });
		}
	};

	const presetNames = () => Object.keys(ctx.store.savedPresets).sort();

	return (
		<fieldset class="fieldset ">
			<legend class="fieldset-legend">Preset</legend>
			<div class="flex items-center gap-2.5">
				<select
					class="select bg-base-300 cursor-pointer"
					// classList={{ "opacity-50": !ctx.store.selectedPreset }}
					value={ctx.store.selectedPreset ?? ""}
					onChange={handleChange}
					disabled={disabled()}
				>
					<option value="" class="opacity-50">
						No selection
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

				<PresetMenu />
			</div>
		</fieldset>
	);
};
