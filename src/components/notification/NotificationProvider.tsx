import {
	createContext,
	createSignal,
	For,
	type ParentComponent,
} from "solid-js";
import { NotificationRenderer } from "./NotificationRenderer";

// Notification types
export type NotificationType = "success" | "error" | "info" | "warning";

// Notification instance stored in stack
export interface NotificationInstance {
	id: string;
	type: NotificationType;
	message: string;
	durationMs: number;
	timerId?: number;
}

// Context value
interface NotificationContextValue {
	success: (message: string, durationMs?: number) => void;
	error: (message: string, durationMs?: number) => void;
	info: (message: string, durationMs?: number) => void;
	warning: (message: string, durationMs?: number) => void;
}

export const NotificationContext = createContext<NotificationContextValue>();

export const NotificationProvider: ParentComponent = (props) => {
	const [stack, setStack] = createSignal<NotificationInstance[]>([]);

	// Core notification function
	const notify = (
		type: NotificationType,
		message: string,
		durationMs = 5000,
	) => {
		const id = crypto.randomUUID();
		const notification: NotificationInstance = {
			id,
			type,
			message,
			durationMs,
		};

		// Add to stack
		setStack([...stack(), notification]);

		// Auto-dismiss timer
		const timerId = window.setTimeout(() => {
			dismiss(id);
		}, durationMs);

		// Store timerId for cleanup
		setStack(stack().map((n) => (n.id === id ? { ...n, timerId } : n)));
	};

	// Manual dismiss
	const dismiss = (id: string) => {
		const notification = stack().find((n) => n.id === id);
		if (notification?.timerId) {
			clearTimeout(notification.timerId);
		}
		setStack(stack().filter((n) => n.id !== id));
	};

	// Public API methods
	const success = (message: string, durationMs?: number) =>
		notify("success", message, durationMs);

	const error = (message: string, durationMs?: number) =>
		notify("error", message, durationMs);

	const info = (message: string, durationMs?: number) =>
		notify("info", message, durationMs);

	const warning = (message: string, durationMs?: number) =>
		notify("warning", message, durationMs);

	return (
		<NotificationContext.Provider value={{ success, error, info, warning }}>
			{props.children}

			{/* Render stack */}
			<div class="toast">
				<For each={stack()}>
					{(notification) => (
						<NotificationRenderer
							notification={notification}
							onClose={() => dismiss(notification.id)}
						/>
					)}
				</For>
			</div>
		</NotificationContext.Provider>
	);
};
