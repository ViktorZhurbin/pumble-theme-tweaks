import { render } from "preact";
import { App } from "@/components/App";
import "./shared.css";

/**
 * Mounts the Preact app to the DOM
 */
const mountApp = (targetId = "app") => {
	const target = document.getElementById(targetId);

	if (!target) {
		throw new Error(`Could not find element with id "${targetId}"`);
	}

	render(<App />, target);
};

export const app = mountApp();
