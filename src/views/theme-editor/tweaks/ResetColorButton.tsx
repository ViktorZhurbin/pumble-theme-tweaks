import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { useSelectedPreset, useWorkingTweak } from "../hooks";

export const ResetColorButton = (props: { propertyName: string }) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);
	const baseValue = useBaseValue(props.propertyName);

	const isModified = () => {
		const workingTweak = tweakEntry();

		if (!workingTweak) return false;

		return workingTweak.value !== null && workingTweak.value !== baseValue();
	};

	const disabled = () => !ctx.store.tweaksOn || !tweakEntry()?.enabled;

	const getResetTooltip = () => {
		if (!isModified()) {
			return "";
		}

		return ctx.store.selectedPreset
			? "Reset to latest saved color"
			: "Reset to Pumble theme color";
	};

	const handleReset = (e: MouseEvent) => {
		e.preventDefault();
		const workingTweak = tweakEntry();
		if (!workingTweak) return;

		ctx.sendToContent("updateWorkingProperty", {
			propertyName: props.propertyName,
			value: baseValue(),
		});
	};

	return (
		<div class="tooltip" data-tip={getResetTooltip()}>
			<button
				class="btn btn-xs btn-ghost btn-circle"
				onClick={handleReset}
				disabled={disabled() || !isModified()}
			>
				<ResetIcon size={16} />
			</button>
		</div>
	);
};

/**
 * Helper: Gets the base value for a property (preset value if selected, otherwise Pumble's initial value)
 * This is the value that "reset" will revert to and what we compare against to determine if modified.
 */
function useBaseValue(propertyName: string) {
	const ctx = useThemeEditorContext();
	const tweakEntry = useWorkingTweak(propertyName);
	const selectedPreset = useSelectedPreset();

	// Return accessor that recomputes on every access
	return () => {
		if (!ctx.store.selectedPreset) {
			// No preset selected - base is Pumble's original value
			return tweakEntry()?.initialValue ?? "";
		}

		// Get value from saved preset (fallback to initial if not in preset)
		return (
			selectedPreset()?.cssProperties[propertyName]?.value ??
			tweakEntry()?.initialValue ??
			""
		);
	};
}
