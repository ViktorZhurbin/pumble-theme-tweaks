import { createMemo, createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Typography } from "@/components/Typography/Typography";
import { ThemeEditorContext } from "@/context/ThemeEditorContext";
import { Background } from "@/entrypoints/background/messenger";
import { initialState } from "@/entrypoints/content/theme-state";
import { logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import type { RuntimeState } from "@/types/runtime";
import { CopyScriptButton } from "./components/CopyScriptButton";
import { CopyTweaksButton } from "./components/CopyTweaksButton";
import { ImportButton } from "./components/ImportButton";
import { PickersContainer } from "./components/PickersContainer";
import { PresetActionsDropdown } from "./components/PresetActionsDropdown";
import { PresetSelector } from "./components/PresetSelector";
import { SaveAsButton } from "./components/SaveAsButton";
import { SaveButton } from "./components/SaveButton";
import {
	getContentScriptState,
	initializeTab,
	injectContentScript,
	isConnectionError,
} from "./helpers";
import styles from "./ThemeEditor.module.css";

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
				<Show when={loading()}>
					<div class="w-full flex justify-center">
						<span class="loading loading-dots" />
					</div>
				</Show>

				<Show when={error()}>
					<Typography as="p" class={styles.error}>
						{error()}
					</Typography>
				</Show>

				<Show when={isReady() && !error()}>
					<div class={styles.tweaksContainer}>
						<Show when={store.themeName}>
							{(themeName) => (
								<Typography as="p" variant="caption" class={styles.themeName}>
									THEME: {themeName()}
								</Typography>
							)}
						</Show>

						<div class={styles.presetSection}>
							<PresetSelector />
							<div class={styles.presetButtons}>
								<SaveButton />
								<SaveAsButton />
								<PresetActionsDropdown />
							</div>
						</div>

						<div class={styles.separator} />

						<div class={styles.controlsContainer}>
							<PickersContainer />

							<div class={styles.separator} />

							<div class={styles.actionsContainer}>
								<div class={styles.copyButtonsWrapper}>
									<CopyTweaksButton />
									<CopyScriptButton />
								</div>
								<ImportButton />
							</div>
						</div>
					</div>
				</Show>
			</div>
		</ThemeEditorContext.Provider>
	);
}
