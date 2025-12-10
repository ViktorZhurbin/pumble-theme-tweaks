import { For } from "solid-js";
import { useDialogs } from "@/components/dialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { PresetMenu } from "./PresetMenu";
import { useHandleRename } from "./useHandleRename";

export const PresetSelector = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;

	const handleChange = async (e: Event) => {
		console.log(e);
		const select = e.target as HTMLOptionElement;
		const value = select.value;
		console.log({ value, selectedPreset: ctx.store.selectedPreset });
		const currentTabId = ctx.tabId();

		if (!currentTabId) {
			logger.warn("PresetSelector: No tab ID available");
			return;
		}

		// Check for unsaved changes
		if (ctx.store.hasUnsavedChanges && value !== ctx.store.selectedPreset) {
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

	const handleRename = useHandleRename();

	const presetNames = () => Object.keys(ctx.store.savedPresets).sort();

	return (
		<fieldset class="fieldset ">
			<legend class="fieldset-legend">Preset</legend>
			<div class="flex items-center gap-2.5">
				<select
					class="select bg-base-300 cursor-pointer"
					// classList={{ "opacity-50": !ctx.store.selectedPreset }}
					value={ctx.store.selectedPreset ?? ""}
					// onChange={handleChange}
					// onSelect={(e) => {
					// 	const select = e.target as HTMLSelectElement;

					// 	console.log("onSelect", { select, value: select.value });
					// }}
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
								onClick={handleChange}
							>
								<div class="flex gap-3 items-center justify-between w-full">
									<span>{presetName}</span>

									<div class="tooltip" data-tip="Rename">
										<button
											class="btn btn-sm btn-ghost btn-square"
											onClick={(e) => {
												e.stopPropagation();
												handleRename(presetName);
											}}
										>
											<PencilIcon class="h-4 w-4" />
										</button>
									</div>
								</div>
							</option>
						)}
					</For>
				</select>

				<PresetMenu />
			</div>
		</fieldset>
	);
};
