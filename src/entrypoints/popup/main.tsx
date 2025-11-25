import { render } from "solid-js/web";
import { App } from "@/components/App";
import "@/app/shared.css";

const target = document.getElementById("app");

if (!target) {
	throw new Error('Could not find element with id "app"');
}

render(() => <App />, target);
