import { For } from "solid-js";
import { COLOR_PICKERS } from "@/constants/properties";
import { ResetToDefaults } from "./ResetToDefaults";
import { ResetToPreset } from "./ResetToPreset";
import { TweakEntryRow } from "./TweakEntryRow";
import { TweaksToggle } from "./TweaksToggle";

export const TweaksContainer = () => {
	return (
		<table class="table">
			<thead>
				<tr>
					<th></th>
					<th>
						<div class="flex gap-1">
							<ResetToDefaults />
							<ResetToPreset />
						</div>
					</th>
					<th></th>
					<th>
						<TweaksToggle />
					</th>
				</tr>
			</thead>
			<tbody>
				<For each={COLOR_PICKERS}>
					{({ label, id }) => <TweakEntryRow label={label} propertyName={id} />}
				</For>
			</tbody>
		</table>
	);
};
