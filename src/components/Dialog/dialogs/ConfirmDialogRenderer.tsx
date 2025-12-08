import { onMount } from "solid-js";
import { DialogActions } from "../components/DialogActions";
import { DialogContent } from "../components/DialogContent";
import { DialogHeader } from "../components/DialogHeader";
import { DialogWrapper } from "../components/DialogWrapper";
import type {
	ConfirmDialogPropsForProvider,
	DialogInstance,
} from "../DialogProvider";

// Renderer for confirm dialogs
export const ConfirmDialogRenderer = (props: {
	instance: DialogInstance;
	onClose: (value: boolean) => void;
}) => {
	let dialogRef!: HTMLDialogElement;
	const dialogProps = props.instance.props as ConfirmDialogPropsForProvider;

	onMount(() => {
		dialogRef?.showModal();
	});

	const handleConfirm = () => {
		dialogRef.close();
		props.onClose(true);
	};

	const handleCancel = () => {
		dialogRef.close();
		props.onClose(false);
	};

	return (
		<DialogWrapper
			ref={dialogRef}
			onCancel={handleCancel}
			onSubmit={handleConfirm}
		>
			<DialogHeader>{dialogProps.title}</DialogHeader>

			{dialogProps.content && (
				<DialogContent>{dialogProps.content}</DialogContent>
			)}

			<DialogActions
				confirmText={dialogProps.confirmText}
				confirmType={dialogProps.confirmType}
				confirmDisabled={dialogProps.confirmDisabled}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
				cancelText={dialogProps.cancelText}
			/>
		</DialogWrapper>
	);
};
