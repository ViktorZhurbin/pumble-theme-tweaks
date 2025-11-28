import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { PROPERTIES } from "@/constants/properties";
import { Background } from "@/entrypoints/background/messenger";
import { ContentScript } from "@/entrypoints/content/messenger";
import { initialState } from "@/entrypoints/content/theme-state";
import { logger } from "@/lib/logger";
import { Utils } from "@/lib/utils";
import type { RuntimeState } from "@/types/runtime";
import { ColorPicker } from "./ColorPicker";
import { GlobalDisableToggle } from "./GlobalDisableToggle";
import { ResetButton } from "./ResetButton";
import {
	getContentScriptState,
	initializeTab,
	injectContentScript,
	isConnectionError,
} from "./ThemeEditor.helpers";
import styles from "./ThemeEditor.module.css";
import { ThemeToggle } from "./ThemeToggle";

export function ThemeEditor() {
	// Use createStore for runtime state (reactive view of content script state)
	const [store, setStore] = createStore<RuntimeState>(initialState);

	const [tabId, setTabId] = createSignal<number | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [loading, setLoading] = createSignal(true);

	const handleReset = () => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		// Optimistic update for responsive UI
		setStore("tweaks", undefined);
		setStore("modifiedProperties", []);

		ContentScript.sendMessage("resetTweaks", undefined, currentTabId);
	};

	const handleResetProperty = (propertyName: string) => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		// Send message to reset this specific property
		ContentScript.sendMessage(
			"resetProperty",
			{ propertyName },
			currentTabId,
		);
	};

	const handleColorChange = (propertyName: string, value: string) => {
		const currentTabId = tabId();
		if (!currentTabId || !store.themeName) return;

		// Optimistic update for responsive UI
		setStore("pickerValues", propertyName, value);

		// Send to content script (ThemeState handles storage and broadcasts updates)
		ContentScript.sendMessage(
			"updateProperty",
			{ propertyName, value },
			currentTabId,
		);
	};

	const handleToggleTweaks = (checked: boolean) => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		// State updates automatically via broadcast
		ContentScript.sendMessage(
			"toggleTweaks",
			{ enabled: checked },
			currentTabId,
		);
	};

	const handleToggleGlobal = (disabled: boolean) => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		// State updates automatically via broadcast
		ContentScript.sendMessage("toggleGlobal", { disabled }, currentTabId);
	};

	const hasModifications = createMemo(() => {
		// Check if there are any modified properties (applied to DOM)
		return store.modifiedProperties && store.modifiedProperties.length > 0;
	});

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

	return (
		<div class={styles.container}>
			<div class={styles.titleGroup}>
				<h3>Pumble Tweaks</h3>
				<Show when={!loading() && !error()}>
					<GlobalDisableToggle
						disabled={store.globalDisabled}
						onChange={handleToggleGlobal}
					/>
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
							<For each={PROPERTIES}>
								{({ label, propertyName }) => (
									<ColorPicker
										label={label}
										value={store.pickerValues[propertyName] || ""}
										inactive={!store.tweakModeOn}
										isModified={store.modifiedProperties.includes(propertyName)}
										onInput={(value) => {
											handleColorChange(propertyName, value);
										}}
										onReset={() => handleResetProperty(propertyName)}
									/>
								)}
							</For>
						</div>

						<div class={styles.separator} />

						<div class={styles.actionsContainer}>
							<ThemeToggle
								checked={store.tweakModeOn}
								disabled={store.globalDisabled}
								onChange={handleToggleTweaks}
							/>

							<ResetButton
								disabled={!hasModifications() || !store.tweakModeOn}
								onClick={handleReset}
							/>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
