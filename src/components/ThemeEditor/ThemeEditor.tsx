import { createSignal, For, onMount, Show } from "solid-js";
import { PROPERTIES } from "@/constants/properties";
import { ChromeUtils } from "@/lib/chrome-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";
import { Utils } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";
import styles from "./ThemeEditor.module.css";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeEditorService } from "./theme-editor.service";

export function ThemeEditor() {
	const [themeName, setThemeName] = createSignal<string | null>(null);
	const [tabId, setTabId] = createSignal<number | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [pickerValues, setPickerValues] = createSignal<Record<string, string>>(
		{},
	);
	const [loading, setLoading] = createSignal(true);
	const [applyTweaks, setApplyTweaks] = createSignal(true);

	const TWEAKS_SAVE_DEBOUNCE_MS = 500;
	const savePropertyDebounced = Utils.debounce(
		(theme: string, propertyName: string, value: string) => {
			Storage.saveProperty(theme, propertyName, value);
		},
		TWEAKS_SAVE_DEBOUNCE_MS,
	);

	const handleReset = async () => {
		const currentTabId = tabId();
		const currentThemeName = themeName();
		if (!currentTabId || !currentThemeName) return;

		const values = await ThemeEditorService.resetTheme(
			currentTabId,
			currentThemeName,
		);
		setPickerValues(values);
	};

	const handleColorChange = (propertyName: string, value: string) => {
		const currentTabId = tabId();
		const currentThemeName = themeName();
		if (!currentTabId || !currentThemeName) return;

		setPickerValues((prev) => ({ ...prev, [propertyName]: value }));
		savePropertyDebounced(currentThemeName, propertyName, value);
		ThemeEditorService.updateColor(
			currentTabId,
			currentThemeName,
			propertyName,
			value,
		);
	};

	const handleToggleTweaks = async () => {
		const currentTabId = tabId();
		const currentThemeName = themeName();
		if (!currentTabId || !currentThemeName) return;

		await ThemeEditorService.toggleTweaks(
			currentTabId,
			currentThemeName,
			applyTweaks(),
			pickerValues(),
		);
	};

	onMount(async () => {
		try {
			const currentTabId = await initializeTab();
			setTabId(currentTabId);

			const theme = await initializeTheme(currentTabId);
			setThemeName(theme);

			const [values, disabled] = await loadThemeData(currentTabId, theme);
			setPickerValues(values);
			setApplyTweaks(!disabled);

			logger.info("ThemeEditor initialized", {
				theme,
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
			<h3>Theme Tweaks</h3>

			<Show when={loading()}>
				<p>Loading...</p>
			</Show>

			<Show when={error()}>
				<p class={styles.error}>{error()}</p>
			</Show>

			<Show when={!loading() && !error()}>
				<ThemeToggle
					checked={applyTweaks()}
					onChange={(checked) => {
						setApplyTweaks(checked);
						handleToggleTweaks();
					}}
				/>

				<div class={styles.pickersContainer}>
					<For each={PROPERTIES}>
						{(config) => (
							<ColorPicker
								label={config.label}
								value={pickerValues()[config.propertyName] || ""}
								inactive={!applyTweaks()}
								onInput={(value) =>
									handleColorChange(config.propertyName, value)
								}
							/>
						)}
					</For>
				</div>

				<button type="button" class={styles.resetBtn} onClick={handleReset}>
					Reset
				</button>
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

/**
 * Initialization helper: Get and validate theme
 */
async function initializeTheme(tabId: number) {
	const theme = await SendMessage.getTheme(tabId);
	if (!theme) {
		throw new Error("Unable to detect Pumble theme");
	}
	return theme;
}

/**
 * Initialization helper: Load theme data
 */
async function loadThemeData(tabId: number, themeName: string) {
	return Promise.all([
		ChromeUtils.getPickerValues(tabId, themeName),
		Storage.getDisabled(themeName),
	]);
}
