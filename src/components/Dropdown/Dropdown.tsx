import { For } from "solid-js";
import type { DropdownItem, DropdownProps } from "./types";

let dropdownCounter = 0;

export function Dropdown(props: DropdownProps) {
	const id = `dropdown-${++dropdownCounter}`;
	const popoverId = `${id}-popover`;
	const anchorName = `--anchor-${id}`;

	let popoverRef!: HTMLUListElement;

	const handleItemClick = (item: DropdownItem) => {
		if (!item.disabled) {
			item.onClick();
			popoverRef.hidePopover();
		}
	};

	const positionX = () => props.positionX ?? "start";
	const position = () => props.position ?? "bottom";

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
				class={`dropdown dropdown-${position()} dropdown-${positionX()} menu bg-base-100 shadow-sm ${menuWidth()} ${props.menuClass ?? ""}`.trim()}
				popover="auto"
				id={popoverId}
				style={{ "position-anchor": anchorName }}
			>
				<For each={props.items}>
					{(item) => (
						<li
							classList={{
								"menu-disabled": item.disabled ?? false,
								"text-error": item.variant === "error" && !item.disabled,
							}}
							onClick={() => handleItemClick(item)}
						>
							<button disabled={item.disabled}>{item.label}</button>
						</li>
					)}
				</For>
			</ul>
		</div>
	);
}
