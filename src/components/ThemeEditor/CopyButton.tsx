import { createSignal } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import type { ThemeTweaks } from "@/types/tweaks";
import styles from "./CopyButton.module.css";

interface CopyButtonProps {
	disabled: boolean;
	themeTweaks?: ThemeTweaks;
}

export function CopyButton(props: CopyButtonProps) {
	const [copied, setCopied] = createSignal(false);

	const handleCopy = async () => {
		if (props.disabled) return;

		try {
			const copyValues = getCopyValues(props.themeTweaks);
			const copyString = copyValues.join(", ");

			// Copy to clipboard
			await navigator.clipboard.writeText(copyString);

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

/**
 * Gets all property values for copying to clipboard
 * Returns current values (custom or initial) for all properties
 */
function getCopyValues(tweaks: ThemeTweaks | undefined): Array<string> {
	return PROPERTIES.map(({ propertyName }) => {
		const entry = tweaks?.cssProperties[propertyName];

		if (!entry) return "";

		return entry.enabled && entry.value !== null
			? entry.value
			: entry.initialValue;
	});
}
