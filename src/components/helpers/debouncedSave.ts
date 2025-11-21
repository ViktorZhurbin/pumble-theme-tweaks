import { debounce } from "@/lib/debounce";
import { Storage } from "@/lib/storage";

export const debouncedSave = debounce(
	(theme: string, varName: string, value: string) => {
		Storage.savePresetVar(theme, varName, value);
	},
	500,
);
