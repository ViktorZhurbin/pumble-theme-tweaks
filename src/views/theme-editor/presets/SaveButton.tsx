import { Show } from "solid-js";
import { Dropdown } from "@/components/Dropdown";
import { CaretDownIcon } from "@/components/icons/CaretDownIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { buttonClass } from "./classes";
import { useHandleSaveAs } from "./useHandleSaveAs";

export const SaveButton = () => {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn || !ctx.store.hasUnsavedChanges;

	const handleSaveAs = useHandleSaveAs();

	const handleSave = () => {
		ctx.sendToContent("savePreset", undefined);
	};

	const handleClick = () => {
		if (ctx.store.selectedPreset) {
			handleSave();
		} else {
			handleSaveAs();
		}
	};

	const getTooltip = () =>
		ctx.store.selectedPreset
			? `Save changes to "${ctx.store.selectedPreset}"`
			: "";

	return (
		<div class="indicator indicator-start">
			<Show when={!disabled()}>
				<span class="indicator-item status status-warning w-1.5 h-1.5"></span>
			</Show>

			<div class="flex">
				<div class="tooltip" data-tip={getTooltip()}>
					<button
						class={`${buttonClass} btn-warning rounded-r-none`}
						onClick={handleClick}
						disabled={disabled()}
					>
						Save
					</button>
				</div>
				<Dropdown
					trigger={{
						content: <CaretDownIcon class="h-3 w-3 shrink-0 stroke-current" />,
						class: `${buttonClass} btn-square rounded-l-none btn-warning w-5`,
						disabled: disabled(),
					}}
					items={[
						{
							type: "item",
							label: "Save as",
							onClick: handleSaveAs,
						},
					]}
				/>
			</div>
		</div>
	);
};
