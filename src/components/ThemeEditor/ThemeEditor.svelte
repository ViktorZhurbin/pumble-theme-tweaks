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
		<div class="toggle-container">
			<label for="toggle-overrides" class="toggle-label">
				<input
					id="toggle-overrides"
					type="checkbox"
					bind:checked={applyOverrides}
					onchange={handleToggleOverrides}
				/>
				{applyOverrides ? "Tweaks ON" : "Tweaks OFF"}
			</label>
		</div>

		<div class="pickers-container">
			{#each CSS_VARIABLES as config (config.propertyName)}
				<label class="picker-group" class:inactive={!applyOverrides}>
					<span class="picker-label">{config.label}</span>
					<input
						type="color"
						value={pickerValues[config.propertyName]}
						oninput={(e) => {
							if (e.target instanceof HTMLInputElement) {
								handleColorChange(config.propertyName, e.target.value);
							}
						}}
					/>
				</label>
			{/each}
		</div>

		<button class="reset-btn" onclick={handleReset}>Reset</button>
	{/if}
</div>

<style>
	h3 {
		text-align: center;
	}

	.toggle-container {
		margin-bottom: 16px;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1.3rem;
		line-height: 1.4;
		cursor: pointer;
		user-select: none;
	}

	input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		flex-shrink: 0;
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

	.picker-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.05);
		padding: 10px 12px;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease-in-out;
		cursor: pointer;
	}

	.picker-group:hover:not(.inactive) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.picker-group.inactive {
		opacity: 0.4;
		pointer-events: none;
		cursor: not-allowed;
	}

	.picker-label {
		font-weight: 600;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	@media (prefers-color-scheme: light) {
		.picker-group {
			background: #ffffff;
			border-color: rgba(0, 0, 0, 0.1);
		}

		.picker-group:hover:not(.inactive) {
			background: #f8f8f8;
			border-color: rgba(0, 0, 0, 0.15);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
	}

	input[type="color"] {
		width: 40px;
		height: 30px;
		cursor: pointer;
		border: none;
		background: none;
		flex-shrink: 0;
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
