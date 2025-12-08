import { ThemeEditor } from "@/views/theme-editor/ThemeEditor";
import { DialogProvider } from "./dialog";

export const App = () => {
	return (
		<DialogProvider>
			<ThemeEditor />
		</DialogProvider>
	);
};
