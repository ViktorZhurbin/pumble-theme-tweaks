import { createSignal, type JSX } from "solid-js";
import { DialogActions } from "./DialogActions";
import { DialogContent } from "./DialogContent";
import { DialogHeader } from "./DialogHeader";
import { DialogWrapper } from "./DialogWrapper";

interface ConfirmDialogProps {
	title: string;
	content?: JSX.Element;
	confirmText?: string;
	cancelText?: string;
	confirmDisabled?: boolean;
	confirmType?: "primary" | "error" | "secondary";
	onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
	let dialogRef!: HTMLDialogElement;
	const [props, setProps] = createSignal<ConfirmDialogProps | null>(null);

	const open = (dialogProps: ConfirmDialogProps) => {
		setProps(dialogProps);
		dialogRef.showModal();
	};

	const close = () => {
		dialogRef.close();
		setProps(null);
	};

	const handleConfirm = async () => {
		const currentProps = props();
		if (currentProps?.onConfirm) {
			try {
				await currentProps.onConfirm();
				close();
			} catch (err) {
				// Let the parent handle errors, but don't close dialog
				console.error("Dialog confirm handler error:", err);
			}
		}
	};

	const Dialog = () => {
		const currentProps = props();
		if (!currentProps) return null;

		return (
			<DialogWrapper ref={dialogRef}>
				<DialogHeader>{currentProps.title}</DialogHeader>

				{currentProps.content && (
					<DialogContent>{currentProps.content}</DialogContent>
				)}

				<DialogActions
					confirmText={currentProps.confirmText}
					confirmType={currentProps.confirmType}
					confirmDisabled={currentProps.confirmDisabled}
					onConfirm={handleConfirm}
				/>
			</DialogWrapper>
		);
	};

	return { open, close, Dialog };
}
