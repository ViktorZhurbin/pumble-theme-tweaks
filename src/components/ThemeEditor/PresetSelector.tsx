import { For, Show, createSignal } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./PresetSelector.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function PresetSelector() {
	const ctx = useThemeEditorContext();
	const [pendingValue, setPendingValue] = createSignal<string | null>(null);

	let confirmDialog!: HTMLDialogElement;

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
			setPendingValue(value);
			confirmDialog.showModal();
			// Reset select to current value (will update after confirmation)
			select.value = ctx.store.selectedPreset ?? "";
			return;
		}

		// No unsaved changes, proceed with load
		await loadPreset(value, currentTabId);
	};

	const handleConfirmSwitch = async () => {
		const value = pendingValue();
		const currentTabId = ctx.tabId();

		if (value === null || !currentTabId) return;

		confirmDialog.close();
		await loadPreset(value, currentTabId);
		setPendingValue(null);
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

			{/* Unsaved changes confirmation dialog */}
			<dialog class="modal" ref={confirmDialog}>
				<div class="modal-box">
					<Typography variant="caption">
						You have unsaved changes. Switch preset anyway?
					</Typography>
					<div class="modal-action">
						<form method="dialog">
							<button class="btn btn-soft btn-secondary">Cancel</button>
							<button
								type="button"
								class="btn btn-soft btn-primary"
								onClick={handleConfirmSwitch}
							>
								Switch
							</button>
						</form>
					</div>
				</div>
			</dialog>
		</div>
	);
}
