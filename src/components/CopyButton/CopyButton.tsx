import { createSignal } from "solid-js";
import styles from "./CopyButton.module.css";

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
			type="button"
			class={styles.copyBtn}
			onClick={handleCopy}
			disabled={props.disabled}
			title={props.title}
		>
			{copied() ? "Copied!" : props.label}
		</button>
	);
}
