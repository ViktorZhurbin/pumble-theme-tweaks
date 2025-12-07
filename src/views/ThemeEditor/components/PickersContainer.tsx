import { For } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import { ResetButton } from "./ResetButton";
import { ThemeToggle } from "./ThemeToggle";
import { TweakEntryRow } from "./TweakEntryRow";

export function PickersContainer() {
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
						<ThemeToggle />
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
}
