import { For } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import { ResetButton } from "./ResetButton";
import { TweakEntryRow } from "./TweakEntryRow";
import { TweaksToggle } from "./TweaksToggle";

export const TweaksContainer = () => {
	return (
		<table class="table">
			<thead>
				<tr>
					<th></th>
					<th>
						<ResetButton />
					</th>
					<th></th>
					<th>
						<TweaksToggle />
					</th>
				</tr>
			</thead>

			<tbody>
				<For each={PROPERTIES}>
					{({ label, propertyName }) => (
						<TweakEntryRow label={label} propertyName={propertyName} />
					)}
				</For>
			</tbody>
		</table>
	);
};
