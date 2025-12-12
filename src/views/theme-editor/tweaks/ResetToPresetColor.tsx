import { UndoIcon } from "@/components/icons/UndoIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { useSelectedPresetValue, useWorkingTweak } from "../hooks";

export const ResetToPresetColor = (props: { propertyName: string }) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);
	const savedValue = useSelectedPresetValue(props.propertyName);

	const baseValue = () => savedValue() ?? tweakEntry()?.initialValue ?? "";

	const isModifiedFromBase = () => {
		const workingTweak = tweakEntry();

		if (!workingTweak) return false;

		return workingTweak.value !== null && workingTweak.value !== baseValue();
	};

	const disabled = () => {
		return (
			!ctx.store.tweaksOn ||
			!ctx.store.selectedPreset ||
			!tweakEntry()?.enabled ||
			!isModifiedFromBase()
		);
	};

	const handleResetToPreset = (e: MouseEvent) => {
		e.preventDefault();
		const workingTweak = tweakEntry();
		if (!workingTweak) return;

		ctx.sendToContent("updateWorkingProperty", {
			propertyName: props.propertyName,
			value: baseValue(),
		});
	};

	return (
		<div class="tooltip" data-tip="Revert to last saved color">
			<button
				class="btn btn-xs btn-ghost btn-circle"
				onClick={handleResetToPreset}
				disabled={disabled()}
			>
				<UndoIcon />
			</button>
		</div>
	);
};
