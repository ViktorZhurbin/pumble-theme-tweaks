import { NewPresetButton } from "./NewPresetButton";
import { PresetDropdown } from "./PresetDropdown";
// import { PresetSelector } from "./PresetSelector";
import { ResetButton } from "./ResetButton";
import { SaveButton } from "./SaveButton";

export const PresetsContainer = () => {
	return (
		<div class="px-6 py-4 flex flex-col gap-2.5">
			<PresetDropdown />

			<div class="flex gap-3">
				<NewPresetButton />
				<SaveButton />
				<ResetButton />
			</div>
		</div>
	);
};
