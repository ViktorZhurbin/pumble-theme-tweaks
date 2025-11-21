import { mount } from "svelte";
import App from "./App.svelte";
import "@/styles/shared.css";

const app = mount(App, {
	// biome-ignore lint/style/noNonNullAssertion: it's ok
	target: document.getElementById("app")!,
});

export default app;
