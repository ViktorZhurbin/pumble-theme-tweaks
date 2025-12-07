import { useThemeEditorContext } from "@/context/ThemeEditorContext";

interface SavePresetAsButtonProps {
	onOpenModal: () => void;
}

export function SavePresetAsButton(props: SavePresetAsButtonProps) {
	const ctx = useThemeEditorContext();

	const disabled = () => !ctx.store.tweaksOn;

	const handleClick = () => {
		props.onOpenModal();
	};

	return (
		<button
			class="btn btn-secondary"
			onClick={handleClick}
			disabled={disabled()}
			title={disabled() ? "Enable tweaks to save" : "Save as new preset"}
		>
			Save As...
		</button>
	);
}
