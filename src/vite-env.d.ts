/// <reference types="vite/client" />
/// <reference types="svelte" />

// Svelte component type declarations
declare module "*.svelte" {
	import type { Component } from "svelte";
	const component: Component;
	export default component;
}

// Asset type declarations
declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.jpeg" {
	const content: string;
	export default content;
}

declare module "*.gif" {
	const content: string;
	export default content;
}

declare module "*.webp" {
	const content: string;
	export default content;
}

declare module "*.ico" {
	const content: string;
	export default content;
}
