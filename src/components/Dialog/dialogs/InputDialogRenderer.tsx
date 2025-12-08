import { createSignal, onMount, Show } from "solid-js";
import { DialogActions } from "../components/DialogActions";
import { DialogContent } from "../components/DialogContent";
import { DialogHeader } from "../components/DialogHeader";
import { DialogWrapper } from "../components/DialogWrapper";
import type {
	DialogInstance,
	InputDialogPropsForProvider,
} from "../DialogProvider";

// Renderer for input dialogs
export const InputDialogRenderer = (props: {
	instance: DialogInstance;
	onClose: (value: string | null) => void;
}) => {
	let dialogRef!: HTMLDialogElement;
	let inputRef: HTMLInputElement | undefined;
	let textAreaRef: HTMLTextAreaElement | undefined;

	const dialogProps = props.instance.props as InputDialogPropsForProvider;
	const [value, setValue] = createSignal(dialogProps.defaultValue ?? "");
	const [error, setError] = createSignal<string | null>(null);

	onMount(() => {
		dialogRef?.showModal();
		inputRef?.focus();
	});

	const handleInput = (e: Event) => {
		const newValue = (e.target as HTMLInputElement).value;
		setValue(newValue);
		setError(null);
	};

	const handleSubmit = () => {
		const currentValue = value().trim();

		// Run validation if provided
		if (dialogProps.validate) {
			const validationError = dialogProps.validate(currentValue);
			if (validationError) {
				setError(validationError);
				return;
			}
		}

		dialogRef.close();
		props.onClose(currentValue);
	};

	const handleCancel = () => {
		dialogRef.close();
		props.onClose(null);
	};

	return (
		<DialogWrapper
			ref={dialogRef}
			onCancel={handleCancel}
			onSubmit={handleSubmit}
		>
			<DialogHeader>{dialogProps.title}</DialogHeader>

			<DialogContent>
				<fieldset class="fieldset mt-2">
					<Show when={!dialogProps.type || dialogProps.type === "input"}>
						<input
							ref={inputRef}
							type="text"
							class="input input-primary w-full"
							placeholder={dialogProps.placeholder ?? ""}
							value={value()}
							onInput={handleInput}
						/>
					</Show>
					<Show when={dialogProps.type === "textarea"}>
						<textarea
							ref={textAreaRef}
							class="textarea h-40"
							placeholder={dialogProps.placeholder ?? ""}
							value={value()}
							onInput={handleInput}
						/>
					</Show>

					<Show when={error()}>
						<p class="label text-error text-wrap">{error()}</p>
					</Show>
				</fieldset>
			</DialogContent>

			<DialogActions
				cancelText={dialogProps.cancelText}
				confirmText={dialogProps.confirmText}
				onConfirm={handleSubmit}
				onCancel={handleCancel}
				confirmDisabled={!value().trim()}
			/>
		</DialogWrapper>
	);
};
