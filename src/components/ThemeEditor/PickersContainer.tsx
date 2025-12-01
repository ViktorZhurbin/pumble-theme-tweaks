import { For } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import { ColorPicker } from "./ColorPicker";
import styles from "./PickersContainer.module.css";
import { ResetButton } from "./ResetButton";
import { ThemeToggle } from "./ThemeToggle";

export function PickersContainer() {
	return (
		<div class={styles.container}>
			{/* Header row */}
			<div class={styles.headerCell} />
			<div class={styles.headerCell}>
				<ResetButton />
			</div>
			<div class={styles.headerCell} />
			<div class={styles.headerCell}>
				<ThemeToggle />
			</div>

			{/* Picker rows */}
			<For each={PROPERTIES}>
				{({ label, propertyName }) => (
					<ColorPicker label={label} propertyName={propertyName} />
				)}
			</For>
		</div>
	);
}
