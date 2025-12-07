import { CopyButton } from "@/components/CopyButton";
import { PROPERTIES } from "@/constants/properties";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import type { WorkingTweaks } from "@/types/tweaks";

export const CopyTweaksButton = () => {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn;

	const handleCopy = async () => {
		const copyObject = getCopyObject(ctx.store.workingTweaks);

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
	tweaks: WorkingTweaks | undefined,
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
