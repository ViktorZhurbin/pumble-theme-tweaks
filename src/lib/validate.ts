export const validatePresetName = (
	name: string,
	savedPresets: Record<string, unknown>,
	existingName?: string,
): string | null => {
	if (!name.trim()) {
		return "Preset name cannot be empty";
	}

	if (existingName && name === existingName) {
		return null;
	}

	if (savedPresets[name]) {
		return `Preset "${name}" already exists`;
	}

	return null;
};
