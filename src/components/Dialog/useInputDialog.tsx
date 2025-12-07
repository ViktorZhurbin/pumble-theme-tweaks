import { createSignal } from "solid-js";
import { DialogActions } from "./DialogActions";
import { DialogContent } from "./DialogContent";
import { DialogHeader } from "./DialogHeader";
import { DialogWrapper } from "./DialogWrapper";

interface InputDialogProps {
	title: string;
	placeholder?: string;
	defaultValue?: string;
	confirmText?: string;
	cancelText?: string;
	validate?: (value: string) => string | null;
	onConfirm: (value: string) => void | Promise<void>;
}

export function useInputDialog() {
	let dialogRef!: HTMLDialogElement;
	let inputRef: HTMLInputElement | undefined;
	const [props, setProps] = createSignal<InputDialogProps | null>(null);
	const [value, setValue] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);

	const open = (dialogProps: InputDialogProps) => {
		setProps(dialogProps);
		setValue(dialogProps.defaultValue ?? "");
		setError(null);
		dialogRef.showModal();
		// Focus input after dialog opens
		setTimeout(() => inputRef?.focus(), 0);
	};

	const close = () => {
		dialogRef.close();
		setProps(null);
		setValue("");
		setError(null);
	};

	const handleInput = (e: Event) => {
		const newValue = (e.target as HTMLInputElement).value;
		setValue(newValue);
		setError(null);
	};

	const handleSubmit = async () => {
		const currentProps = props();
		const currentValue = value().trim();

		if (!currentProps) return;

		// Run validation if provided
		if (currentProps.validate) {
			const validationError = currentProps.validate(currentValue);
			if (validationError) {
				setError(validationError);
				return;
			}
		}

		try {
			await currentProps.onConfirm(currentValue);
			close();
		} catch (err) {
			// Let the parent handle errors, but don't close dialog
			console.error("Dialog confirm handler error:", err);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			close();
		}
	};

	const Dialog = () => {
		const currentProps = props();
		if (!currentProps) return null;

		return (
			<DialogWrapper ref={dialogRef}>
				<DialogHeader>{currentProps.title}</DialogHeader>

				<DialogContent>
					<input
						ref={inputRef}
						type="text"
						class="input input-primary w-full mt-4"
						placeholder={currentProps.placeholder ?? ""}
						value={value()}
						onInput={handleInput}
						onKeyDown={handleKeyDown}
					/>

					{error() && <p class="text-error mt-2">{error()}</p>}
				</DialogContent>

				<DialogActions
					cancelText={currentProps.cancelText}
					confirmText={currentProps.confirmText}
					onConfirm={handleSubmit}
					confirmDisabled={!value().trim()}
				/>
			</DialogWrapper>
		);
	};

	return { open, close, Dialog };
}
