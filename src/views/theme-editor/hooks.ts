import { useThemeEditorContext } from "@/context/ThemeEditorContext";

export const useWorkingTweak = (propertyName: string) => {
	const ctx = useThemeEditorContext();

	return () => ctx.store.workingTweaks?.cssProperties[propertyName];
};

export const useSelectedPreset = () => {
	const ctx = useThemeEditorContext();

	return () =>
		ctx.store.selectedPreset
			? ctx.store.savedPresets[ctx.store.selectedPreset]
			: null;
};
