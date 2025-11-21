import type { Component } from "svelte";
import { mount } from "svelte";
import App from "@/components/App.svelte";
import "./shared.css";

/**
 * Mounts a Svelte component to the DOM
 */
const mountApp = (component: Component, targetId = "app") => {
	const target = document.getElementById(targetId);

	if (!target) {
		throw new Error(`Could not find element with id "${targetId}"`);
	}

	return mount(component, { target });
};

export const app = mountApp(App);
