import { ResetIcon } from "@/components/icons/ResetIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { useWorkingTweak } from "../hooks";

export const ResetToDefaultColor = (props: { propertyName: string }) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);

	// Shared disabled state (tweaks off or property disabled)
	const disabled = () => !ctx.store.tweaksOn || !tweakEntry()?.enabled;

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
		<div class="tooltip" data-tip="Reset to Pumble theme color">
			<button
				class="btn btn-xs btn-ghost btn-circle opacity-60 hover:opacity-100"
				onClick={handleResetToDefault}
				disabled={disabled() || !isModifiedFromInitial()}
			>
				<ResetIcon />
			</button>
		</div>
	);
};
