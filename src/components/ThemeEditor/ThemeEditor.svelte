<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { Storage } from "@/lib/storage";
	import { CSS_VARIABLES } from "@/constants/config";
	import { SendMessage } from "@/lib/messaging";
	import { ChromeUtils } from "@/lib/chrome-utils";
	import { Utils } from "@/lib/utils";
	import { logger } from "@/lib/logger";

	let themeName = $state<string | null>(null);
	let tabId = $state<number | null>(null);
	let error = $state<string | null>(null);
	let pickerValues = $state<Record<string, string>>({});
	let loading = $state(true);

	let storageListener:
		| ((
				changes: { [key: string]: chrome.storage.StorageChange },
				area: chrome.storage.AreaName
		  ) => void)
		| null = null;

	// Create debounced save function once
	const savePresetVarDebounced = Utils.debounce(
		(theme: string, varName: string, value: string) => {
			Storage.savePresetVar(theme, varName, value);
		},
		500
	);

	async function handleReset() {
		if (!tabId || !themeName) return;

		logger.info("Resetting theme overrides", { theme: themeName });
		await Storage.deletePreset(themeName);

		await SendMessage.resetVars(tabId);
		const values = await ChromeUtils.getPickerValues(tabId, themeName);

		pickerValues = values;
		logger.debug("Theme reset complete");
	}

	function handleColorChange(varName: string, value: string) {
		if (!tabId || !themeName) return;

		pickerValues[varName] = value;

		SendMessage.updateVar(tabId, varName, value);

		savePresetVarDebounced(themeName, varName, value);
	}

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
	<h3>Theme Editor</h3>

	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		{#if themeName}
			<div class="theme-label">Theme: {themeName}</div>
		{/if}

		<div class="pickers-container">
			{#each CSS_VARIABLES as config (config.propertyName)}
				<div class="picker-group">
					<label for={config.propertyName}>{config.label}</label>
					<input
						id={config.propertyName}
						type="color"
						value={pickerValues[config.propertyName]}
						oninput={(e) => {
							if (e.target instanceof HTMLInputElement) {
								handleColorChange(config.propertyName, e.target.value);
							}
						}}
					/>
				</div>
			{/each}
		</div>

		<button class="reset-btn" onclick={handleReset}>Reset</button>
	{/if}
</div>

<style>
	h3 {
		margin-top: 0;
		text-align: center;
		font-size: 2rem;
	}

	.theme-label {
		font-size: 1rem;
		margin-bottom: 10px;
	}

	.error {
		color: #d32f2f;
		text-align: center;
	}

	.pickers-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 20px;
	}

	.picker-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: white;
		padding: 8px 10px;
		border-radius: 6px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	label {
		font-weight: 600;
		font-size: 14px;
		color: #444;
	}

	input[type="color"] {
		width: 40px;
		height: 30px;
		cursor: pointer;
		border: none;
		background: none;
	}

	.reset-btn {
		width: 100%;
		padding: 10px;
		background-color: #fff;
		border: 1px solid #ccc;
		color: #666;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
		transition: all 0.2s;
	}

	.reset-btn:hover {
		background-color: #eee;
		color: #333;
		border-color: #bbb;
	}
</style>
