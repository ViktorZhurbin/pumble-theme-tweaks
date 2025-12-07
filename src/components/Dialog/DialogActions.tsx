export const DialogActions = (props: {
	cancelText?: string;
	confirmText?: string;
	confirmType?: "primary" | "error" | "secondary";
	confirmDisabled?: boolean;
	onConfirm: () => void | Promise<void>;
}) => {
	return (
		<div class="modal-action">
			<form method="dialog" class="flex items-center gap-3">
				<button class="btn btn-soft btn-secondary">
					{props.cancelText ?? "Cancel"}
				</button>
				<button
					type="button"
					class={`btn btn-soft btn-${props.confirmType ?? "primary"}`}
					onClick={() => {
						props.onConfirm();
					}}
					disabled={props.confirmDisabled}
				>
					{props.confirmText ?? "Save"}
				</button>
			</form>
		</div>
	);
};
