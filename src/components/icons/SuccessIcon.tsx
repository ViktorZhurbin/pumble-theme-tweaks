import { getIconSize } from "./helpers";
import type { IconProps } from "./types";

export const SuccessIcon = (props: IconProps) => {
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
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	);
};
