interface ResetIconButtonProps {
	onClick: (e: MouseEvent) => void;
	disabled?: boolean;
	title?: string;
	class?: string;
	size?: number;
}

export function ResetIconButton(props: ResetIconButtonProps) {
	const size = () => props.size ?? 16;

	return (
		<button
			class={`btn btn-sm btn-neutral btn-circle ${props.class ?? ""}`.trim()}
			onClick={props.onClick}
			disabled={props.disabled}
			title={props.title ?? "Reset to default"}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={size()}
				height={size()}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<title>{props.title ?? "Reset to default"}</title>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path d="M3.06 13a9 9 0 1 0 .49 -4.087" />
				<path d="M3 4.001v5h5" />
				<path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
			</svg>
		</button>
	);
}
