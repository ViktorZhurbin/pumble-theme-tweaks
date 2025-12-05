import "./styles.css";

import { render } from "solid-js/web";
import { App } from "@/components/App";

const target = document.getElementById("app");

if (!target) {
	throw new Error('Could not find element with id "app"');
}

render(() => <App />, target);
