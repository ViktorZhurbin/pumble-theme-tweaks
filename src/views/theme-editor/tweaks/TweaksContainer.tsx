import { For } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import { TweakEntryRow } from "./TweakEntryRow";
import { TweaksToggle } from "./TweaksToggle";

export const TweaksContainer = () => {
	return (
		<table class="table">
			<tbody>
				<For each={PROPERTIES}>
					{({ label, propertyName }) => (
						<TweakEntryRow label={label} propertyName={propertyName} />
					)}
				</For>
			</tbody>

			<tfoot>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					<td>
						<TweaksToggle />
					</td>
				</tr>
			</tfoot>
		</table>
	);
};
