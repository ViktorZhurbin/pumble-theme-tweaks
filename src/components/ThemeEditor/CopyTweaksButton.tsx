import { PROPERTIES } from "@/constants/properties";
import type { ThemeTweaks } from "@/types/tweaks";
import { CopyButton } from "../CopyButton/CopyButton";
import { useThemeEditorContext } from "./ThemeEditorContext";

export const CopyTweaksButton = () => {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.themeTweaksOn;

	const handleCopy = async () => {
		const copyObject = getCopyObject(ctx.store.themeTweaks);

		return JSON.stringify(copyObject, null, 2);
	};

	return (
		<CopyButton
			disabled={disabled()}
			title={disabled() ? "Enable tweaks to copy" : "Copy theme to share"}
			label="Share"
			onCopy={handleCopy}
		/>
	);
};

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
