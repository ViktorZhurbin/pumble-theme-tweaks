import { debounce } from "@/lib/debounce";
import { saveStoredPresetVar } from "@/lib/storage";

export const debouncedSave = debounce(
	(theme: string, varName: string, value: string) => {
		saveStoredPresetVar(theme, varName, value);
	},
	500,
);
