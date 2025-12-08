import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
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
		if (areTweaksOff()) return "Enable tweaks to reset";
		if (!tweakEntry()?.enabled) return "Enable this property to reset";
		if (!isModified()) {
			return "No changes to reset";
		}
		return ctx.store.selectedPreset
			? "Reset to saved preset value"
			: "Reset to Pumble default";
	};

	const handleReset = (e: MouseEvent) => {
		e.preventDefault();
		const currentTabId = ctx.tabId();
		const workingTweak = tweakEntry();
		if (!currentTabId || !workingTweak) return;

		ContentScript.sendMessage(
			"updateWorkingProperty",
			{ propertyName: props.propertyName, value: baseValue() },
			currentTabId,
		);
	};

	const handleToggle = (e: Event) => {
		const enabled = (e.target as HTMLInputElement).checked;
		const currentTabId = ctx.tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage(
			"toggleWorkingProperty",
			{ propertyName: props.propertyName, enabled },
			currentTabId,
		);
	};

	const disabledClasses = "opacity-25 pointer-events-none";
	const inactiveClass = () => (disabled() ? disabledClasses : "");

	return (
		<tr class="hover:bg-base-300">
			<td class={`${inactiveClass()}`.trim()}>{props.label}</td>

			<td class={inactiveClass()}>
				<button
					class="btn btn-xs btn-ghost btn-circle"
					onClick={handleReset}
					disabled={disabled() || !isModified()}
					title={getResetTooltip()}
				>
					<ResetIcon size={16} />
				</button>
			</td>

			<td class={inactiveClass()}>
				<ColorPicker disabled={disabled()} propertyName={props.propertyName} />
			</td>

			<td class={areTweaksOff() ? disabledClasses : ""}>
				<input
					type="checkbox"
					class="checkbox checkbox-primary checkbox-sm"
					checked={tweakEntry()?.enabled ?? true}
					disabled={areTweaksOff()}
					onChange={handleToggle}
					title="Enable this color tweak"
				/>
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
