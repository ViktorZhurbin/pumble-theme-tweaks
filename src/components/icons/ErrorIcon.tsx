import { getIconSize } from "./helpers";
import type { IconProps } from "./types";

export const ErrorIcon = (props: IconProps) => {
	return (
		<svg
			width={getIconSize(props)}
			height={getIconSize(props)}
			class={props.class}
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	);
};
