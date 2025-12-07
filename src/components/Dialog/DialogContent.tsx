import type { ParentComponent } from "solid-js";

export const DialogContent: ParentComponent = (props) => {
	return <p>{props.children}</p>;
};
