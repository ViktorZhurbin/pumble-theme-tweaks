import { createMemo, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { ThemeEditorContext } from "@/context/ThemeEditorContext";
import { Background } from "@/entrypoints/background/messenger";
import { initialState } from "@/entrypoints/content/theme-state";
import { logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import type { RuntimeState } from "@/types/runtime";
import {
	getContentScriptState,
	initializeTab,
	injectContentScript,
	isConnectionError,
} from "./helpers";
import { PresetsContainer } from "./presets";
import { TweaksContainer } from "./tweaks";

export const ThemeEditor = () => {
	// Use createStore for runtime state (reactive view of content script state)
	const [store, setStore] = createStore<RuntimeState>(initialState);

	const [tabId, setTabId] = createSignal<number | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [loading, setLoading] = createSignal(true);

	const isReady = createMemo(() => tabId() !== null && !loading());

	// Listen for state changes from content script
	Background.onMessage("stateChanged", (msg) => {
		// Only update if the state change is from the current tab
		const messageTabId = msg.data.tabId;
		const currentTabId = tabId();

		logger.debug("State changed from content script", {
			willUpdate: messageTabId === currentTabId,
		});

		// Filter: only apply state changes from our own tab
		if (messageTabId !== undefined && messageTabId === currentTabId) {
			setStore(msg.data.state);
		}
	});

	onMount(async () => {
		try {
			const currentTabId = await initializeTab();
			setTabId(currentTabId);

			// Try to get runtime state from content script
			let runtimeState: RuntimeState;
			try {
				runtimeState = await getContentScriptState(currentTabId);
			} catch (err) {
				// If content script is not injected, inject it programmatically
				if (isConnectionError(err)) {
					logger.info("Content script not found, injecting programmatically");

					await injectContentScript(currentTabId);
					await Utils.wait(100);

					// Retry getting the state
					runtimeState = await getContentScriptState(currentTabId);
				} else {
					throw err;
				}
			}

			setStore(runtimeState);

			logger.info("ThemeEditor initialized", {
				state: runtimeState,
				tabId: currentTabId,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			logger.error("ThemeEditor initialization failed", { error: err });
		} finally {
			setLoading(false);
		}
	});

	const contextValue = {
		tabId,
		store,
		setStore,
		isReady,
	};

	return (
		<ThemeEditorContext.Provider value={contextValue}>
			<div class="flex-col gap-3">
				<Show when={loading()}>
					<div class="w-full flex justify-center">
						<span class="loading loading-dots" />
					</div>
				</Show>

				<Show when={error()}>
					<p class="text-error text-wrap text-sm rounded-xl text-center p-4 bg-red-200 border border-red-500">
						error()
					</p>
				</Show>

				<Show when={isReady() && !error()}>
					<div class="flex-col bg-base-100 rounded-lg border border-neutral-700">
						<PresetsContainer />
						<div class="divider my-0 h-0.5" />
						<TweaksContainer />
					</div>
				</Show>
			</div>
		</ThemeEditorContext.Provider>
	);
};
