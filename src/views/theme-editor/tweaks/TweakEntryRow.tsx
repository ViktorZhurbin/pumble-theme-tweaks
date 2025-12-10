import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import type { StoredPreset } from "@/types/storage";
import { ColorPicker } from "./ColorPicker";

interface TweakEntryRowProps {
	label: string;
	propertyName: string;
}

export const TweakEntryRow = (props: TweakEntryRowProps) => {
	const ctx = useThemeEditorContext();

	// Derive from context instead of props
	const tweakEntry = () =>
		ctx.store.workingTweaks?.cssProperties[props.propertyName];

	const areTweaksOff = () => !ctx.store.tweaksOn;
	const disabled = () => areTweaksOff() || !tweakEntry()?.enabled;

	const baseValue = () =>
		getBaseValue(
			props.propertyName,
			ctx.store.selectedPreset,
			ctx.store.savedPresets,
			tweakEntry()?.initialValue,
		);

	const isModified = () => {
		const workingTweak = tweakEntry();
		if (!workingTweak) return false;

		return workingTweak.value !== null && workingTweak.value !== baseValue();
	};

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

	const handleToggle = (e: Event) => {
		const enabled = (e.target as HTMLInputElement).checked;

		ctx.sendToContent("toggleWorkingProperty", {
			propertyName: props.propertyName,
			enabled,
		});
	};

	const disabledClasses = "opacity-25 pointer-events-none";
	const inactiveClass = () => (disabled() ? disabledClasses : "");

	return (
		<tr class="hover:bg-base-300">
			<td class={`${inactiveClass()}`.trim()}>{props.label}</td>

			<td class={inactiveClass()}>
				<div class="tooltip" data-tip={getResetTooltip()}>
					<button
						class="btn btn-xs btn-ghost btn-circle"
						onClick={handleReset}
						disabled={disabled() || !isModified()}
					>
						<ResetIcon size={16} />
					</button>
				</div>
			</td>

			<td class={inactiveClass()}>
				<div class="tooltip" data-tip="Pick a color">
					<ColorPicker
						disabled={disabled()}
						propertyName={props.propertyName}
					/>
				</div>
			</td>

			<td class={areTweaksOff() ? disabledClasses : ""}>
				<div class="tooltip" data-tip="Toggle">
					<input
						type="checkbox"
						class="checkbox checkbox-primary checkbox-sm"
						checked={tweakEntry()?.enabled ?? true}
						disabled={areTweaksOff()}
						onChange={handleToggle}
					/>
				</div>
			</td>
		</tr>
	);
};

/**
 * Helper: Gets the base value for a property (preset value if selected, otherwise Pumble's initial value)
 * This is the value that "reset" will revert to and what we compare against to determine if modified.
 */
function getBaseValue(
	propertyName: string,
	selectedPreset: string | null,
	savedPresets: Record<string, StoredPreset>,
	initialValue: string,
): string {
	if (!selectedPreset) {
		// No preset selected - base is Pumble's original value
		return initialValue;
	}

	// Get value from saved preset (fallback to initial if not in preset)
	const savedTweak = savedPresets[selectedPreset]?.cssProperties[propertyName];
	return savedTweak?.value ?? initialValue;
}
