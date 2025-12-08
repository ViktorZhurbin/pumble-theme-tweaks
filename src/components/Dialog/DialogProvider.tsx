import {
	createContext,
	createSignal,
	For,
	type JSX,
	type ParentComponent,
} from "solid-js";
import { ConfirmDialogRenderer } from "./dialogs/ConfirmDialogRenderer";
import { InputDialogRenderer } from "./dialogs/InputDialogRenderer";

// Props for confirm dialogs (without onConfirm callback)
export interface ConfirmDialogPropsForProvider {
	title: string;
	content?: JSX.Element;
	confirmText?: string;
	cancelText?: string;
	confirmDisabled?: boolean;
	confirmType?: "primary" | "error" | "secondary";
}

// Props for input dialogs (without onConfirm callback)
export interface InputDialogPropsForProvider {
	type?: "input" | "textarea";
	title: string;
	placeholder?: string;
	defaultValue?: string;
	confirmText?: string;
	cancelText?: string;
	validate?: (value: string) => string | null;
}

// Dialog instance stored in stack (discriminated union)
export type DialogInstance =
	| {
			id: string;
			type: "confirm";
			props: ConfirmDialogPropsForProvider;
			resolve: (value: boolean) => void;
	  }
	| {
			id: string;
			type: "input";
			props: InputDialogPropsForProvider;
			resolve: (value: string | null) => void;
	  };

// Context value
interface DialogContextValue {
	confirm: (props: ConfirmDialogPropsForProvider) => Promise<boolean>;
	input: (props: InputDialogPropsForProvider) => Promise<string | null>;
}

export const DialogContext = createContext<DialogContextValue>();

export const DialogProvider: ParentComponent = (props) => {
	const [stack, setStack] = createSignal<DialogInstance[]>([]);

	// Confirm dialog - returns Promise<boolean>
	const confirm = (
		dialogProps: ConfirmDialogPropsForProvider,
	): Promise<boolean> => {
		return new Promise((resolve) => {
			const id = crypto.randomUUID();
			setStack([
				...stack(),
				{ id, type: "confirm", props: dialogProps, resolve },
			]);
		});
	};

	// Input dialog - returns Promise<string | null>
	const input = (
		dialogProps: InputDialogPropsForProvider,
	): Promise<string | null> => {
		return new Promise((resolve) => {
			const id = crypto.randomUUID();
			setStack([
				...stack(),
				{ id, type: "input", props: dialogProps, resolve },
			]);
		});
	};

	// Close confirm dialog and resolve promise
	const closeConfirm = (id: string, value: boolean) => {
		const dialog = stack().find((d) => d.id === id && d.type === "confirm");
		if (dialog && dialog.type === "confirm") {
			dialog.resolve(value);
			setStack(stack().filter((d) => d.id !== id));
		}
	};

	// Close input dialog and resolve promise
	const closeInput = (id: string, value: string | null) => {
		const dialog = stack().find((d) => d.id === id && d.type === "input");
		if (dialog && dialog.type === "input") {
			dialog.resolve(value);
			setStack(stack().filter((d) => d.id !== id));
		}
	};

	return (
		<DialogContext.Provider value={{ confirm, input }}>
			{props.children}

			{/* Render all dialogs in stack */}
			<For each={stack()}>
				{(instance) => {
					if (instance.type === "input") {
						return (
							<InputDialogRenderer
								instance={instance}
								onClose={(value) => closeInput(instance.id, value)}
							/>
						);
					}

					return (
						<ConfirmDialogRenderer
							instance={instance}
							onClose={(value) => closeConfirm(instance.id, value)}
						/>
					);
				}}
			</For>
		</DialogContext.Provider>
	);
};
