import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { useWorkingTweak } from "../hooks";
import { bodyButtonClasses } from "./classes";

export const ResetToDefaultColor = (props: { propertyName: string }) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);

	// Shared disabled state (tweaks off or property disabled)
	const disabled = () => !ctx.store.tweaksOn || !tweakEntry()?.enabled;
	const hidden = () => !ctx.store.selectedPreset;

	// Check if modified from initialValue (for ResetToDefault)
	const isModifiedFromInitial = () => {
		const workingTweak = tweakEntry();

		if (!workingTweak) return false;

		return (
			workingTweak.value !== null &&
			workingTweak.value !== workingTweak.initialValue
		);
	};

	const handleResetToDefault = (e: MouseEvent) => {
		e.preventDefault();
		const workingTweak = tweakEntry();

		if (!workingTweak) return;

		ctx.sendToContent("updateWorkingProperty", {
			propertyName: props.propertyName,
			value: workingTweak.initialValue,
		});
	};

	return (
		<div
			class="tooltip"
			data-tip="Reset to Pumble theme color"
			classList={{
				invisible: hidden(),
			}}
		>
			<button
				class={bodyButtonClasses}
				onClick={handleResetToDefault}
				disabled={disabled() || !isModifiedFromInitial()}
			>
				<ResetIcon />
			</button>
		</div>
	);
};
