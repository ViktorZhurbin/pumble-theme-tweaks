import { createSignal } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import styles from "./CopyButton.module.css";

interface CopyButtonProps {
	values: Record<string, string>;
	disabled: boolean;
}

export function CopyButton(props: CopyButtonProps) {
	const [copied, setCopied] = createSignal(false);

	const handleCopy = async () => {
		if (props.disabled) return;

		try {
			// Get values in PROPERTIES order
			const values = PROPERTIES.map(
				({ propertyName }) => props.values[propertyName] || "",
			);

			// Join with comma and space
			const csvString = values.join(", ");

			// Copy to clipboard
			await navigator.clipboard.writeText(csvString);

			// Show feedback
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
			title={props.disabled ? "Enable tweaks to copy" : "Copy all values"}
		>
			{copied() ? "Copied!" : "Copy"}
		</button>
	);
}
