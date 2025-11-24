import { createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { PROPERTIES } from "@/constants/properties";
import { ChromeUtils } from "@/lib/chrome-utils";
import { logger } from "@/lib/logger";
import { Background, ContentScript, type RuntimeState } from "@/lib/messages";
import { ColorPicker } from "./ColorPicker";
import { GlobalDisableToggle } from "./GlobalDisableToggle";
import styles from "./ThemeEditor.module.css";
import { ThemeToggle } from "./ThemeToggle";

export function ThemeEditor() {
	// Use createStore for runtime state (reactive view of content script state)
	const [store, setStore] = createStore<RuntimeState>({
		themeName: null,
		tweakModeOn: true,
		pickerValues: {},
		tweaks: undefined,
		modifiedProperties: [],
		globalDisabled: false,
	});

	const [tabId, setTabId] = createSignal<number | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [loading, setLoading] = createSignal(true);

	const handleReset = () => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		ContentScript.sendMessage("resetTweaks", {}, currentTabId);
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

	const hasStoredTweaks = () => {
		return !!(
			store.tweaks?.cssProperties &&
			Object.keys(store.tweaks.cssProperties).length > 0
		);
	};

	// Listen for state changes from content script
	Background.onMessage("stateChanged", (msg) => {
		logger.debug("State changed from content script", {
			state: msg.data.state,
		});
		setStore(msg.data.state);
	});

	onMount(async () => {
		try {
			const currentTabId = await initializeTab();
			setTabId(currentTabId);

			// Get runtime state from content script (source of truth)
			const runtimeState = await ContentScript.sendMessage(
				"getCurrentState",
				{},
				currentTabId,
			);
			setStore(runtimeState);

			logger.info("ThemeEditor initialized", {
				state: runtimeState,
				tabId: currentTabId,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	});

	return (
		<div class={styles.container}>
			<div class={styles.titleGroup}>
				<h3>Theme Tweaks</h3>
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
							<p class={styles.themeName}>Theme: {themeName()}</p>
						)}
					</Show>
					<div class={styles.controls}>
						<Show when={hasStoredTweaks()}>
							<ThemeToggle
								checked={store.tweakModeOn}
								onChange={handleToggleTweaks}
							/>
						</Show>

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
									/>
								)}
							</For>
						</div>

						<Show when={hasStoredTweaks()}>
							<button
								type="button"
								class={styles.resetBtn}
								onClick={handleReset}
							>
								Reset
							</button>
						</Show>
					</div>
				</div>
			</Show>
		</div>
	);
}

/**
 * Initialization helper: Get and validate active tab
 * Returns tab ID
 */
async function initializeTab(): Promise<number> {
	const tab = await ChromeUtils.getActiveTab();
	if (!tab?.id) {
		throw new Error("Please open a Pumble tab");
	}
	return tab.id;
}
