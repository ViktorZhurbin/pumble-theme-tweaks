import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import type { TweakEntry } from "@/types/tweaks";
import { ColorPicker } from "./ColorPicker";
import styles from "./TweakEntryRow.module.css";

interface TweakEntryRowProps {
	label: string;
	propertyName: string;
}

export function TweakEntryRow(props: TweakEntryRowProps) {
	const ctx = useThemeEditorContext();

	// Derive from context instead of props
	const tweakEntry = () =>
		ctx.store.workingTweaks?.cssProperties[props.propertyName];

	const areTweaksOff = () => !ctx.store.tweaksOn;
	const disabled = () => areTweaksOff() || !tweakEntry()?.enabled;

	const handleReset = (e: MouseEvent) => {
		e.preventDefault();
		const currentTabId = ctx.tabId();
		const entry = tweakEntry();
		if (!currentTabId || !entry) return;

		// Reset to initial value by updating working property
		ContentScript.sendMessage(
			"updateWorkingProperty",
			{ propertyName: props.propertyName, value: entry.initialValue },
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

	const inactiveClass = () => (disabled() ? styles.inactive : "");

	return (
		<tr class="hover:bg-base-300">
			<th class={`text-sm ${inactiveClass()}`.trim()}>{props.label}</th>

			<th class={inactiveClass()}>
				{isPropertyModified(tweakEntry()) && (
					<button
						class="btn btn-sm btn-neutral btn-circle"
						onClick={handleReset}
						disabled={disabled()}
					>
						<ResetIcon size={18} />
					</button>
				)}
			</th>

			<th class={inactiveClass()}>
				<ColorPicker disabled={disabled()} propertyName={props.propertyName} />
			</th>

			<th classList={{ [styles.inactive]: areTweaksOff() }}>
				<input
					type="checkbox"
					class="checkbox checkbox-primary checkbox-sm"
					checked={tweakEntry()?.enabled ?? true}
					disabled={areTweaksOff()}
					onChange={handleToggle}
					title="Enable this color tweak"
				/>
			</th>
		</tr>
	);
}

/**
 * Checks if a property has been modified from its initial value
 */
function isPropertyModified(entry: TweakEntry | undefined): boolean {
	if (!entry) return false;

	return entry.value !== null && entry.value !== entry.initialValue;
}
