import { For } from "solid-js";
import type { DropdownItem, DropdownProps } from "./types";

let dropdownCounter = 0;

export const Dropdown = (props: DropdownProps) => {
	const id = `dropdown-${++dropdownCounter}`;
	const popoverId = `${id}-popover`;
	const anchorName = `--anchor-${id}`;

	let popoverRef!: HTMLUListElement;

	const handleItemClick = (item: DropdownItem) => {
		if (item.type === "item" && !item.disabled) {
			item.onClick();
			popoverRef.hidePopover();
		}
	};

	const menuWidth = () => props.menuWidth ?? "w-36";

	return (
		<div>
			<button
				class={props.trigger.class ?? "btn"}
				popoverTarget={popoverId}
				style={{ "anchor-name": anchorName }}
				disabled={props.trigger.disabled}
				title={props.trigger.title}
			>
				{props.trigger.content}
			</button>

			<ul
				ref={popoverRef}
				class={`dropdown dropdown-bottom dropdown-end menu bg-base-300 shadow-sm ${menuWidth()} ${props.menuClass ?? ""}`.trim()}
				popover="auto"
				id={popoverId}
				style={{ "position-anchor": anchorName }}
			>
				<For each={props.items}>
					{(item) => {
						if (item.type === "divider") {
							return <span class="divider m-0" />;
						}

						return (
							<li
								classList={{
									"menu-disabled": item.disabled ?? false,
									"text-error": item.variant === "error" && !item.disabled,
								}}
								onClick={() => handleItemClick(item)}
							>
								<button disabled={item.disabled}>{item.label}</button>
							</li>
						);
					}}
				</For>
			</ul>
		</div>
	);
};
