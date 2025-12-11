import { For } from "solid-js";
import { COLOR_PICKERS } from "@/constants/properties";
import { TweakEntryRow } from "./TweakEntryRow";
import { TweaksToggle } from "./TweaksToggle";

export const TweaksContainer = () => {
	return (
		<table class="table">
			<tbody>
				<For each={COLOR_PICKERS}>
					{({ label, id }) => <TweakEntryRow label={label} propertyName={id} />}
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
