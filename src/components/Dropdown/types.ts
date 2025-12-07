import type { JSX } from "solid-js";

export interface DropdownItem {
	/** Label text for the menu item */
	label: string;
	/** Click handler for the item */
	onClick: () => void;
	/** Whether the item is disabled */
	disabled?: boolean;
	/** Visual variant - "error" for destructive actions */
	variant?: "default" | "error";
}

export interface DropdownTrigger {
	/** Content inside the trigger button (text or JSX) */
	content: JSX.Element | string;
	/** Additional CSS classes for the button */
	class?: string;
	/** Whether the button is disabled */
	disabled?: boolean;
	/** Tooltip text for the button */
	title?: string;
}

export interface DropdownProps {
	/** Array of menu items */
	items: DropdownItem[];
	/** Trigger button configuration */
	trigger: DropdownTrigger;
	/** Popover position relative to trigger */
	positionX?: "end" | "start" | "center";
	position?: "top" | "bottom" | "left" | "right";
	/** Additional CSS classes for the menu */
	menuClass?: string;
	/** Fixed width for the menu (e.g., "w-36", "w-48") */
	menuWidth?: string;
}
