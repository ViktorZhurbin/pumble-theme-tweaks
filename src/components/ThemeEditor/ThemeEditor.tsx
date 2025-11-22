import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
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
	const [themeName, setThemeName] = useState<string | null>(null);
	const [tabId, setTabId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pickerValues, setPickerValues] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [applyOverrides, setApplyOverrides] = useState(true);

	const storageListenerRef = useRef<
		| ((
				changes: { [key: string]: chrome.storage.StorageChange },
				area: chrome.storage.AreaName,
		  ) => void)
		| null
	>(null);

	const savePresetVarDebounced = useRef(
		Utils.debounce((theme: string, varName: string, value: string) => {
			Storage.savePresetVar(theme, varName, value);
		}, 500),
	).current;

	const handleReset = async () => {
		if (!tabId || !themeName) return;

		logger.info("Resetting theme overrides", { theme: themeName });
		await Storage.deletePreset(themeName);

		await SendMessage.resetVars(tabId);
		const values = await ChromeUtils.getPickerValues(tabId, themeName);

		setPickerValues(values);
		logger.debug("Theme reset complete");
	};

	const handleColorChange = (varName: string, value: string) => {
		if (!tabId || !themeName) return;

		setPickerValues((prev) => ({ ...prev, [varName]: value }));

		SendMessage.updateVar(tabId, varName, value);

		savePresetVarDebounced(themeName, varName, value);
	};

	const handleToggleOverrides = async () => {
		if (!tabId) return;

		if (applyOverrides) {
			logger.debug("Applying theme overrides");
			for (const [varName, value] of Object.entries(pickerValues)) {
				SendMessage.updateVar(tabId, varName, value);
			}
		} else {
			logger.debug("Removing theme overrides from document");
			await SendMessage.resetVars(tabId);
		}
	};

	useEffect(() => {
		const initialize = async () => {
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

			storageListenerRef.current = (changes, area) => {
				if (area === "sync" && changes.theme_presets && tabId && themeName) {
					logger.debug("Storage changed externally, refreshing picker values");
					ChromeUtils.getPickerValues(tabId, themeName)
						.then((values) => {
							setPickerValues(values);
						})
						.catch((err) => {
							logger.error("Failed to refresh picker values:", err);
						});
				}
			};

			chrome.storage.onChanged.addListener(storageListenerRef.current);
		};

		initialize();

		return () => {
			if (storageListenerRef.current) {
				chrome.storage.onChanged.removeListener(storageListenerRef.current);
			}
		};
	}, []);

	return (
		<div class="container">
			<h3>Theme Tweaks</h3>

			{loading && <p>Loading...</p>}

			{error && <p class="error">{error}</p>}

			{!loading && !error && (
				<>
					<ThemeToggle
						checked={applyOverrides}
						onChange={(checked) => {
							setApplyOverrides(checked);
							handleToggleOverrides();
						}}
					/>

					<div class="pickers-container">
						{CSS_VARIABLES.map((config) => (
							<ColorPicker
								key={config.propertyName}
								label={config.label}
								value={pickerValues[config.propertyName] || ""}
								inactive={!applyOverrides}
								onInput={(value) =>
									handleColorChange(config.propertyName, value)
								}
							/>
						))}
					</div>

					<button class="reset-btn" onClick={handleReset}>
						Reset
					</button>
				</>
			)}
		</div>
	);
}
