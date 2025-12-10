// import { Show } from "solid-js";
import { Dropdown, type DropdownItem } from "@/components/Dropdown";
import { useDialogs } from "@/components/dialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import { PresetMenu } from "./PresetMenu";
import { useHandleRename } from "./useHandleRename";

export const PresetDropdown = () => {
	const ctx = useThemeEditorContext();
	const dialogs = useDialogs();

	const disabled = () => !ctx.store.tweaksOn;

	const handleChange = async (value: string) => {
		console.log({ value, selectedPreset: ctx.store.selectedPreset });
		const currentTabId = ctx.tabId();

		if (!currentTabId) {
			logger.warn("PresetDropdown: No tab ID available");
			return;
		}

		// Check for unsaved changes
		if (ctx.store.hasUnsavedChanges && value !== ctx.store.selectedPreset) {
			// Show confirmation dialog
			const confirmed = await dialogs.confirm({
				title: "You have unsaved changes. Switch preset anyway?",
				confirmText: "Switch",
				confirmType: "primary",
			});

			if (confirmed) {
				await loadPreset(value, currentTabId);
			}
			return;
		}

		// No unsaved changes, proceed with load
		await loadPreset(value, currentTabId);
	};

	const loadPreset = async (value: string, currentTabId: number) => {
		if (value === "") {
			// User selected "No Preset Selected" - reset working tweaks
			await ContentScript.sendMessage(
				"resetWorkingTweaks",
				undefined,
				currentTabId,
			);
		} else {
			// Load the selected preset
			await ContentScript.sendMessage(
				"loadPreset",
				{ presetName: value },
				currentTabId,
			);
		}
	};

	const handleRename = useHandleRename();

	const RenameButton = (props: { presetName: string }) => {
		return (
			<div class="tooltip" data-tip="Rename">
				<button
					class="btn btn-sm btn-ghost btn-square"
					onClick={(e) => {
						e.stopPropagation();
						handleRename(props.presetName);
					}}
				>
					<PencilIcon class="h-4 w-4" />
				</button>
			</div>
		);
	};

	const Option = (props: { presetName: string }) => {
		return (
			<div class="flex flex-1 gap-3 items-center justify-between w-full">
				<span>{props.presetName}</span>
				<RenameButton presetName={props.presetName} />
			</div>
		);
	};

	const items = (): DropdownItem[] =>
		Object.keys(ctx.store.savedPresets).map((presetName) => {
			return {
				type: "item",
				label: <Option presetName={presetName} />,
				selected: presetName === ctx.store.selectedPreset,
				onClick: () => handleChange(presetName),
			};
		});

	// const TriggerContent = () => {
	// 	return (
	// 		<div>
	// 			<span>{ctx.store.selectedPreset}</span>
	// 			<Show when={ctx.store.selectedPreset}>
	// 				{ctx.store.selectedPreset && (
	// 					<RenameButton presetName={ctx.store.selectedPreset} />
	// 				)}
	// 			</Show>
	// 		</div>
	// 	);
	// };

	const widthClass = "w-57";

	return (
		<div class={`flex items-center justify-between gap-2.5 ${widthClass}`}>
			<Dropdown
				class={`${widthClass}`}
				menuClass={`${widthClass}`}
				trigger={{
					content: ctx.store.selectedPreset,
					class: "btn btn-soft select bg-base-300 justify-start",
					wrapperClass: `${widthClass}`,
					disabled: disabled(),
				}}
				items={items()}
			/>
			<PresetMenu />
		</div>
	);
};
