import type { ParentComponent } from "solid-js";

export const DialogWrapper: ParentComponent<{ ref: HTMLDialogElement }> = (
	props,
) => {
	return (
		<dialog class="modal" ref={props.ref}>
			<div class="modal-box">{props.children}</div>
		</dialog>
	);
};
