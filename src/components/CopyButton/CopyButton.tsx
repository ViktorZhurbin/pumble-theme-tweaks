import { createSignal } from "solid-js";

export function CopyButton(props: {
	disabled: boolean;
	title: string;
	label: string;
	onCopy: () => Promise<string>;
}) {
	const [copied, setCopied] = createSignal(false);

	const handleCopy = async () => {
		if (props.disabled) return;

		try {
			const copyString = await props.onCopy();

			await navigator.clipboard.writeText(copyString);

			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
		}
	};

	return (
		<button
			class="btn btn-outline"
			onClick={handleCopy}
			disabled={props.disabled}
			title={props.title}
		>
			{copied() ? "Copied!" : props.label}
		</button>
	);
}
