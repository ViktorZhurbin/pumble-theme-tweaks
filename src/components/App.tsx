import { ThemeEditor } from "@/views/theme-editor/ThemeEditor";
import { DialogProvider } from "./dialog";
import { NotificationProvider } from "./notification";

export const App = () => {
	return (
		<DialogProvider>
			<NotificationProvider>
				<ThemeEditor />
			</NotificationProvider>
		</DialogProvider>
	);
};
