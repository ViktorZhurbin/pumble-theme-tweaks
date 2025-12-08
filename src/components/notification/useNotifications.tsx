import { useContext } from "solid-js";
import { NotificationContext } from "./NotificationProvider";

export const useNotifications = () => {
	const context = useContext(NotificationContext);

	if (!context) {
		throw new Error(
			"useNotifications must be used within NotificationProvider",
		);
	}

	return context;
};
