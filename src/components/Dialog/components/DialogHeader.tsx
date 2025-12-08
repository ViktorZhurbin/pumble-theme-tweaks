import type { ParentComponent } from "solid-js";

export const DialogHeader: ParentComponent = (props) => {
	return <p class="text-base font-semibold">{props.children}</p>;
};
