import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { useWorkingTweak } from "../hooks";
import { ColorPicker } from "./ColorPicker";
import { ResetColorButton } from "./ResetColorButton";

interface TweakEntryRowProps {
	label: string;
	propertyName: string;
}

export const TweakEntryRow = (props: TweakEntryRowProps) => {
	const ctx = useThemeEditorContext();

	const tweakEntry = useWorkingTweak(props.propertyName);

	const areTweaksOff = () => !ctx.store.tweaksOn;
	const disabled = () => areTweaksOff() || !tweakEntry()?.enabled;

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
				<ResetColorButton propertyName={props.propertyName} />
			</td>

			<td class={inactiveClass()}>
				<ColorPicker disabled={disabled()} propertyName={props.propertyName} />
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
