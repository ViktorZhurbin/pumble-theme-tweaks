import { type Accessor, createContext, useContext } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import type { RuntimeState } from "@/types/runtime";

/**
 * Context value for ThemeEditor and its child components.
 *
 * Provides shared state using SolidJS reactive primitives for fine-grained reactivity.
 * Components track dependencies at the property level - only accessed properties trigger re-renders.
 *
 * Note: SolidJS components execute ONCE (not on every render like React).
 * The context value object is created once during mount - inline object creation is safe.
 */
export interface ThemeEditorContextValue {
	/** Signal accessor for current tab ID. Null during initialization. */
	tabId: Accessor<number | null>;

	/** Store proxy for runtime theme state. Supports fine-grained property access. */
	store: RuntimeState;

	/** Store setter function for updating runtime state (e.g., optimistic updates). */
	setStore: SetStoreFunction<RuntimeState>;

	/** Derived signal (memo) indicating if the editor is ready for interaction. */
	isReady: Accessor<boolean>;
}

const ThemeEditorContext = createContext<ThemeEditorContextValue>();

export const useThemeEditorContext = () => {
	const context = useContext(ThemeEditorContext);
	if (!context) {
		throw new Error(
			"useThemeEditorContext must be used within ThemeEditorProvider",
		);
	}
	return context;
};

export { ThemeEditorContext };
