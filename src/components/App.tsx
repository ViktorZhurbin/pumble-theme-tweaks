import { ThemeEditor } from "@/views/theme-editor/ThemeEditor";
import { DialogProvider } from "./dialog";

export function App() {
	return (
		<DialogProvider>
			<ThemeEditor />
		</DialogProvider>
	);
}
