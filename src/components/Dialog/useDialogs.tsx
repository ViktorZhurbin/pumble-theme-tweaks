import { useContext } from "solid-js";
import { DialogContext } from "./DialogProvider";

export const useDialogs = () => {
	const context = useContext(DialogContext);

	if (!context) {
		throw new Error("useDialogs must be used within DialogProvider");
	}

	return context;
};
