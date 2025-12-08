import type { ParentComponent } from "solid-js";

export const DialogWrapper: ParentComponent<{
	ref: HTMLDialogElement;
	onSubmit: () => void;
	onCancel: () => void;
}> = (props) => {
	const handleKeyDown = (e: KeyboardEvent) => {
		switch (e.key) {
			case "Enter": {
				e.preventDefault();
				props.onSubmit();
				break;
			}

			case "Escape": {
				e.preventDefault();
				props.onCancel();
				break;
			}

			default:
				break;
		}
	};

	return (
		<dialog class="modal" ref={props.ref} onKeyDown={handleKeyDown}>
			<div class="modal-box">{props.children}</div>

			{/* Handles close on click outside */}
			<form method="dialog" class="modal-backdrop">
				<button class="cursor-default">cancel</button>
			</form>
		</dialog>
	);
};
