import { createSignal, onMount, Show } from "solid-js";
import { Button } from "@/components/Button/Button";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./SavePresetAsModal.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

interface SavePresetAsModalProps {
	show: boolean;
	onClose: () => void;
}

export function SavePresetAsModal(props: SavePresetAsModalProps) {
	const ctx = useThemeEditorContext();
	const [presetName, setPresetName] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);
	let inputRef: HTMLInputElement | undefined;

	onMount(() => {
		if (props.show && inputRef) {
			inputRef.focus();
		}
	});

	const handleInputChange = (e: Event) => {
		const value = (e.target as HTMLInputElement).value;
		setPresetName(value);
		setError(null);
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
			logger.warn("SavePresetAsModal: No tab ID available");
			return;
		}

		try {
			await ContentScript.sendMessage(
				"savePresetAs",
				{ presetName: name },
				currentTabId,
			);

			// Close modal and reset
			props.onClose();
			setPresetName("");
			setError(null);
		} catch (err) {
			logger.error("SavePresetAsModal: Failed to save preset", err);
			setError("Failed to save preset");
		}
	};

	const handleCancel = () => {
		props.onClose();
		setPresetName("");
		setError(null);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	return (
		<Show when={props.show}>
			<div class={styles.overlay} onClick={handleCancel}>
				<div class={styles.modal} onClick={(e) => e.stopPropagation()}>
					<Typography variant="body" class={styles.title}>
						Save Preset As
					</Typography>

					<input
						ref={inputRef}
						type="text"
						class={styles.input}
						placeholder="Enter preset name"
						value={presetName()}
						onInput={handleInputChange}
						onKeyDown={handleKeyDown}
					/>

					<Show when={error()}>
						<Typography variant="caption" class={styles.error}>
							{error()}
						</Typography>
					</Show>

					<div class={styles.buttons}>
						<Button variant="secondary" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSave}
							disabled={!presetName().trim()}
						>
							Save
						</Button>
					</div>
				</div>
			</div>
		</Show>
	);
}
