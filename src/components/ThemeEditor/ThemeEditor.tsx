import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { CSS_VARIABLES } from "@/constants/config";
import { ChromeUtils } from "@/lib/chrome-utils";
import { logger } from "@/lib/logger";
import { SendMessage } from "@/lib/messaging";
import { Storage } from "@/lib/storage";
import { Utils } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";
import { ThemeToggle } from "./ThemeToggle";
import "./ThemeEditor.css";

export function ThemeEditor() {
	const [themeName, setThemeName] = createSignal<string | null>(null);
	const [tabId, setTabId] = createSignal<number | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [pickerValues, setPickerValues] = createSignal<Record<string, string>>(
		{},
	);
	const [loading, setLoading] = createSignal(true);
	const [applyOverrides, setApplyOverrides] = createSignal(true);

	let storageListener:
		| ((
				changes: { [key: string]: chrome.storage.StorageChange },
				area: chrome.storage.AreaName,
		  ) => void)
		| null = null;

	const PRESET_SAVE_DEBOUNCE_MS = 500;
	const savePresetVarDebounced = Utils.debounce(
		(theme: string, varName: string, value: string) => {
			Storage.savePresetVar(theme, varName, value);
		},
		PRESET_SAVE_DEBOUNCE_MS,
	);

	const handleReset = async () => {
		const currentTabId = tabId();
		const currentThemeName = themeName();
		if (!currentTabId || !currentThemeName) return;

		logger.info("Resetting theme overrides", { theme: currentThemeName });
		await Storage.deletePreset(currentThemeName);

		await SendMessage.resetVars(currentTabId);
		const values = await ChromeUtils.getPickerValues(
			currentTabId,
			currentThemeName,
		);

		setPickerValues(values);
		logger.debug("Theme reset complete");
	};

	const handleColorChange = (varName: string, value: string) => {
		const currentTabId = tabId();
		const currentThemeName = themeName();
		if (!currentTabId || !currentThemeName) return;

		setPickerValues((prev) => ({ ...prev, [varName]: value }));

		SendMessage.updateVar(currentTabId, varName, value);

		savePresetVarDebounced(currentThemeName, varName, value);
	};

	const handleToggleOverrides = async () => {
		const currentTabId = tabId();
		if (!currentTabId) return;

		if (applyOverrides()) {
			logger.debug("Applying theme overrides");
			for (const [varName, value] of Object.entries(pickerValues())) {
				SendMessage.updateVar(currentTabId, varName, value);
			}
		} else {
			logger.debug("Removing theme overrides from document");
			await SendMessage.resetVars(currentTabId);
		}
	};

	onMount(async () => {
		const tab = await ChromeUtils.getActiveTab();

		if (!tab?.id) {
			setError("Please open a Pumble tab");
			setLoading(false);
			return;
		}

		setTabId(tab.id);
		const currentTheme = await SendMessage.getTheme(tab.id);

		if (!currentTheme) {
			setError("Unable to detect Pumble theme");
			setLoading(false);
			return;
		}

		setThemeName(currentTheme);
		const values = await ChromeUtils.getPickerValues(tab.id, currentTheme);

		setPickerValues(values);
		setLoading(false);
		logger.info("ThemeEditor initialized", {
			theme: currentTheme,
			tabId: tab.id,
			variableCount: Object.keys(values).length,
		});

		storageListener = (changes, area) => {
			if (area === "sync" && changes.theme_presets && tabId() && themeName()) {
				logger.debug("Storage changed externally, refreshing picker values");
				ChromeUtils.getPickerValues(tabId()!, themeName()!)
					.then((values) => {
						setPickerValues(values);
					})
					.catch((err) => {
						logger.error("Failed to refresh picker values:", err);
					});
			}
		};

		chrome.storage.onChanged.addListener(storageListener);
	});

	onCleanup(() => {
		if (storageListener) {
			chrome.storage.onChanged.removeListener(storageListener);
		}
	});

	return (
		<div class="container">
			<h3>Theme Tweaks</h3>

			<Show when={loading()}>
				<p>Loading...</p>
			</Show>

			<Show when={error()}>
				<p class="error">{error()}</p>
			</Show>

			<Show when={!loading() && !error()}>
				<ThemeToggle
					checked={applyOverrides()}
					onChange={(checked) => {
						setApplyOverrides(checked);
						handleToggleOverrides();
					}}
				/>

				<div class="pickers-container">
					<For each={CSS_VARIABLES}>
						{(config) => (
							<ColorPicker
								label={config.label}
								value={pickerValues()[config.propertyName] || ""}
								inactive={!applyOverrides()}
								onInput={(value) =>
									handleColorChange(config.propertyName, value)
								}
							/>
						)}
					</For>
				</div>

				<button type="button" class="reset-btn" onClick={handleReset}>
					Reset
				</button>
			</Show>
		</div>
	);
}
