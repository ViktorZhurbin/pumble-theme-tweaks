import { ErrorIcon } from "@/components/icons/ErrorIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";
import { SuccessIcon } from "@/components/icons/SuccessIcon";
import { WarningIcon } from "@/components/icons/WarningIcon";
import { CloseIcon } from "../icons/CloseIcon";
import type { NotificationInstance } from "./NotificationProvider";

interface Props {
	notification: NotificationInstance;
	onClose: () => void;
}

export const NotificationRenderer = (props: Props) => {
	const { type, message } = props.notification;

	// Map type to icon component
	const Icon = () => {
		switch (type) {
			case "success":
				return <SuccessIcon />;
			case "error":
				return <ErrorIcon />;
			case "info":
				return <InfoIcon />;
			case "warning":
				return <WarningIcon />;
		}
	};

	// Map type to daisyUI alert class
	const alertClass = () => {
		switch (type) {
			case "success":
				return "alert-success";
			case "error":
				return "alert-error";
			case "info":
				return "alert-info";
			case "warning":
				return "alert-warning";
		}
	};

	return (
		<div role="alert" class={`alert ${alertClass()}`}>
			<Icon />
			<span class="flex-1">{message}</span>
			<button
				class="btn btn-ghost btn-xs btn-circle"
				onClick={props.onClose}
				aria-label="Close notification"
			>
				<CloseIcon />
			</button>
		</div>
	);
};
