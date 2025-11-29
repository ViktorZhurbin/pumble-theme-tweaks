import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { PROPERTIES } from "@/constants/properties";
import { Background } from "@/entrypoints/background/messenger";
import { initialState } from "@/entrypoints/content/theme-state";
import { logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import type { RuntimeState } from "@/types/runtime";
import { ColorPicker } from "./ColorPicker";
import { CopyScriptButton } from "./CopyScriptButton";
import { CopyTweaksButton } from "./CopyTweaksButton";
import { GlobalDisableToggle } from "./GlobalDisableToggle";
import { ImportButton } from "./ImportButton";
import { ResetButton } from "./ResetButton";
import {
	getContentScriptState,
	initializeTab,
	injectContentScript,
	isConnectionError,
} from "./ThemeEditor.helpers";
import styles from "./ThemeEditor.module.css";
import { ThemeEditorContext } from "./ThemeEditorContext";
import { ThemeToggle } from "./ThemeToggle";

export function ThemeEditor() {
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
			<div class={styles.container}>
				<div class={styles.titleGroup}>
					<h3>Pumble Tweaks</h3>
					<Show when={!loading() && !error()}>
						<GlobalDisableToggle />
					</Show>
				</div>

				<Show when={loading()}>
					<p>Loading...</p>
				</Show>

				<Show when={error()}>
					<p class={styles.error}>{error()}</p>
				</Show>

				<Show when={!loading() && !error()}>
					<div class={styles.tweaksContainer}>
						<Show when={store.themeName}>
							{(themeName) => (
								<p class={styles.themeName}>THEME: {themeName()}</p>
							)}
						</Show>
						<div class={styles.controlsContainer}>
							<div class={styles.pickersContainer}>
								<ThemeToggle />
								<For each={PROPERTIES}>
									{({ label, propertyName }) => (
										<ColorPicker label={label} propertyName={propertyName} />
									)}
								</For>
							</div>

							<div class={styles.separator} />

							<div class={styles.actionsContainer}>
								<ImportButton />
								<div class={styles.copyButtonsWrapper}>
									<CopyTweaksButton />
									<CopyScriptButton />
								</div>
								<ResetButton />
							</div>
						</div>
					</div>
				</Show>
			</div>
		</ThemeEditorContext.Provider>
	);
}
