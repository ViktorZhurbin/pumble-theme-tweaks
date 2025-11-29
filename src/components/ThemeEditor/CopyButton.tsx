import { createSignal } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import type { ThemeTweaks } from "@/types/tweaks";
import styles from "./CopyButton.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

export function CopyButton() {
	const ctx = useThemeEditorContext();
	const [copied, setCopied] = createSignal(false);

	// Derive from context
	const disabled = () => !ctx.store.themeTweaksOn;

	const handleCopy = async () => {
		if (disabled()) return;

		try {
			const copyObject = getCopyObject(ctx.store.themeTweaks);
			const copyString = JSON.stringify(copyObject, null, 2);

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
			disabled={disabled()}
			title={disabled() ? "Enable tweaks to copy" : "Copy all values"}
		>
			{copied() ? "Copied!" : "Copy"}
		</button>
	);
}

/**
 * Gets all property values as an object for copying to clipboard
 * Returns object with property names as keys and current values (custom or initial)
 */
function getCopyObject(
	tweaks: ThemeTweaks | undefined,
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const { propertyName } of PROPERTIES) {
		const entry = tweaks?.cssProperties[propertyName];

		if (entry) {
			// Include current value (custom or initial)
			result[propertyName] =
				entry.enabled && entry.value !== null
					? entry.value
					: entry.initialValue;
		}
	}

	return result;
}
