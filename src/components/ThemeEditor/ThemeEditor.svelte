<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { Storage } from "@/lib/storage";
	import { CSS_VARIABLES } from "@/constants/config";
	import { SendMessage } from "@/lib/messaging";
	import { ChromeUtils } from "@/lib/chrome-utils";
	import { Utils } from "@/lib/utils";
	import { logger } from "@/lib/logger";
	import ThemeToggle from "./ThemeToggle.svelte";
	import ColorPicker from "./ColorPicker.svelte";

	let themeName = $state<string | null>(null);
	let tabId = $state<number | null>(null);
	let error = $state<string | null>(null);
	let pickerValues = $state<Record<string, string>>({});
	let loading = $state(true);
	let applyOverrides = $state(true);

	let storageListener:
		| ((
				changes: { [key: string]: chrome.storage.StorageChange },
				area: chrome.storage.AreaName
		  ) => void)
		| null = null;

	// Create debounced save function once
	const PRESET_SAVE_DEBOUNCE_MS = 500;
	const savePresetVarDebounced = Utils.debounce(
		(theme: string, varName: string, value: string) => {
			Storage.savePresetVar(theme, varName, value);
		},
		PRESET_SAVE_DEBOUNCE_MS
	);

	const handleReset = async () => {
		if (!tabId || !themeName) return;

		logger.info("Resetting theme overrides", { theme: themeName });
		await Storage.deletePreset(themeName);

		await SendMessage.resetVars(tabId);
		const values = await ChromeUtils.getPickerValues(tabId, themeName);

		pickerValues = values;
		logger.debug("Theme reset complete");
	};

	const handleColorChange = (varName: string, value: string) => {
		if (!tabId || !themeName) return;

		pickerValues[varName] = value;

		SendMessage.updateVar(tabId, varName, value);

		savePresetVarDebounced(themeName, varName, value);
	};

	const handleToggleOverrides = async () => {
		if (!tabId) return;

		if (applyOverrides) {
			// Apply all stored picker values
			logger.debug("Applying theme overrides");
			for (const [varName, value] of Object.entries(pickerValues)) {
				SendMessage.updateVar(tabId, varName, value);
			}
		} else {
			// Remove CSS overrides but keep storage
			logger.debug("Removing theme overrides from document");
			await SendMessage.resetVars(tabId);
		}
	};

	onMount(async () => {
		const tab = await ChromeUtils.getActiveTab();

		if (!tab?.id) {
			error = "Please open a Pumble tab";
			loading = false;
			return;
		}

		tabId = tab.id;
		const currentTheme = await SendMessage.getTheme(tab.id);

		if (!currentTheme) {
			error = "Unable to detect Pumble theme";
			loading = false;
			return;
		}

		themeName = currentTheme;
		const values = await ChromeUtils.getPickerValues(tabId, themeName);

		pickerValues = values;
		loading = false;
		logger.info("ThemeEditor initialized", {
			theme: themeName,
			tabId,
			variableCount: Object.keys(values).length,
		});

		// Listen for external storage changes
		storageListener = (changes, area) => {
			if (area === "sync" && changes.theme_presets && tabId && themeName) {
				logger.debug("Storage changed externally, refreshing picker values");
				ChromeUtils.getPickerValues(tabId, themeName)
					.then((values) => {
						pickerValues = values;
					})
					.catch((err) => {
						logger.error("Failed to refresh picker values:", err);
					});
			}
		};

		chrome.storage.onChanged.addListener(storageListener);
	});

	onDestroy(() => {
		// Cleanup: remove listener when component is destroyed
		if (storageListener) {
			chrome.storage.onChanged.removeListener(storageListener);
		}
	});
</script>

<div class="container">
	<h3>Theme Tweaks</h3>

	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<ThemeToggle bind:checked={applyOverrides} onchange={handleToggleOverrides} />

		<div class="pickers-container">
			{#each CSS_VARIABLES as config (config.propertyName)}
				<ColorPicker
					label={config.label}
					value={pickerValues[config.propertyName]}
					inactive={!applyOverrides}
					oninput={(value) => handleColorChange(config.propertyName, value)}
				/>
			{/each}
		</div>

		<button class="reset-btn" onclick={handleReset}>Reset</button>
	{/if}
</div>

<style>
	h3 {
		text-align: center;
	}

	.error {
		color: #d32f2f;
		text-align: center;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.pickers-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 24px;
	}

	.reset-btn {
		width: 100%;
		background-color: #f44336;
		color: white;
		box-shadow: 0 2px 4px rgba(244, 67, 54, 0.2);
	}

	.reset-btn:hover {
		background-color: #d32f2f;
		box-shadow: 0 3px 6px rgba(244, 67, 54, 0.3);
		transform: translateY(-1px);
	}

	.reset-btn:active {
		transform: translateY(0);
		box-shadow: 0 1px 2px rgba(244, 67, 54, 0.2);
	}
</style>
