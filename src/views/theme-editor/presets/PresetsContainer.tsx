import { NewPresetButton } from "./NewPresetButton";
import { PresetSelector } from "./PresetSelector";
import { SaveButton } from "./SaveButton";

export const PresetsContainer = () => {
	return (
		<div class="px-6 py-4 flex flex-col gap-2.5">
			<PresetSelector />

			<div class="flex gap-3">
				<NewPresetButton />
				<SaveButton />
			</div>
		</div>
	);
};
