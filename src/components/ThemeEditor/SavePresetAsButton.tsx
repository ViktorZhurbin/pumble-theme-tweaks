import { Button } from "@/components/Button/Button";
import { useThemeEditorContext } from "./ThemeEditorContext";

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
		<Button
			variant="secondary"
			onClick={handleClick}
			disabled={disabled()}
			title={disabled() ? "Enable tweaks to save" : "Save as new preset"}
		>
			Save As...
		</Button>
	);
}
