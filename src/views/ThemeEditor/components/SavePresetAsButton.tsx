import { createSignal } from "solid-js";
import { Typography } from "@/components/Typography/Typography";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

export function SavePresetAsButton() {
	const ctx = useThemeEditorContext();
	const [presetName, setPresetName] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);

	let dialog!: HTMLDialogElement;
	let inputRef: HTMLInputElement | undefined;

	const disabled = () => !ctx.store.tweaksOn;

	const openDialog = () => {
		setPresetName("");
		setError(null);
		dialog.showModal();
		setTimeout(() => inputRef?.focus(), 0);
	};

	const handleSave = async () => {
		const name = presetName().trim();

		if (!name) {
			setError("Preset name cannot be empty");
			return;
		}

		if (ctx.store.savedPresets[name]) {
			setError(`Preset "${name}" already exists`);
			return;
		}

		const currentTabId = ctx.tabId();
		if (!currentTabId) {
			logger.warn("SavePresetAsButton: No tab ID available");
			return;
		}

		try {
			await ContentScript.sendMessage(
				"savePresetAs",
				{ presetName: name },
				currentTabId,
			);
			dialog.close();
		} catch (err) {
			logger.error("SavePresetAsButton: Failed to save preset", err);
			setError("Failed to save preset");
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			dialog.close();
		}
	};

	return (
		<>
			<button
				class="btn btn-secondary"
				onClick={openDialog}
				disabled={disabled()}
				title={disabled() ? "Enable tweaks to save" : "Save as new preset"}
			>
				Save As...
			</button>

			<dialog class="modal" ref={dialog}>
				<div class="modal-box">
					<Typography variant="caption" class="font-semibold mb-4">
						Save Preset As
					</Typography>

					<input
						ref={inputRef}
						type="text"
						class="input input-bordered w-full mt-4"
						placeholder="Enter preset name"
						value={presetName()}
						onInput={(e) => {
							setPresetName(e.currentTarget.value);
							setError(null);
						}}
						onKeyDown={handleKeyDown}
					/>

					{error() && (
						<Typography variant="caption" class="text-error mt-2">
							{error()}
						</Typography>
					)}

					<div class="modal-action">
						<form method="dialog">
							<button class="btn btn-soft btn-secondary">Cancel</button>
							<button
								type="button"
								class="btn btn-soft btn-primary"
								onClick={handleSave}
								disabled={!presetName().trim()}
							>
								Save
							</button>
						</form>
					</div>
				</div>
			</dialog>
		</>
	);
}
