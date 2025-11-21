<script lang="ts">
	import { onMount } from "svelte";
	import {
		deleteStoredPreset,
		getStoredPreset,
		saveStoredPresetVar,
	} from "@/lib/storage";
	import { CSS_VARIABLES } from "@/lib/config";
	import { SendMessage } from "@/lib/messaging";
	import { debounce } from "@/lib/debounce";

	let themeName = $state<string | null>(null);
	let tabId = $state<number | null>(null);
	let error = $state<string | null>(null);
	let pickerValues = $state<Record<string, string>>({});
	let loading = $state(true);

	/**
	 * Gets the active tab
	 */
	async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		return tab || null;
	}

	/**
	 * Loads all UI elements with current data
	 */
	async function loadUI(
		currentTabId: number,
		currentTheme: string
	): Promise<void> {
		const varNames = CSS_VARIABLES.map((v) => v.name);
		const [storedPreset, liveValues] = await Promise.all([
			getStoredPreset(currentTheme),
			SendMessage.readVars(currentTabId, varNames),
		]);

		const values: Record<string, string> = {};
		CSS_VARIABLES.forEach((config) => {
			values[config.name] =
				storedPreset?.[config.name] || liveValues[config.name] || "#000000";
		});

		pickerValues = values;
	}

	/**
	 * Refreshes picker values without recreating UI
	 */
	async function refreshUI(
		currentTabId: number,
		currentTheme: string
	): Promise<void> {
		const varNames = CSS_VARIABLES.map((v) => v.name);
		const [storedPreset, liveValues] = await Promise.all([
			getStoredPreset(currentTheme),
			SendMessage.readVars(currentTabId, varNames),
		]);

		const values: Record<string, string> = {};
		CSS_VARIABLES.forEach((config) => {
			values[config.name] =
				storedPreset?.[config.name] || liveValues[config.name] || "#000000";
		});

		pickerValues = values;
	}

	/**
	 * Handles the reset button click
	 */
	async function handleReset(): Promise<void> {
		if (!tabId || !themeName) return;

		await deleteStoredPreset(themeName);

		await SendMessage.resetVars(tabId);
		await refreshUI(tabId, themeName);
	}

	/**
	 * Handles color input change
	 */
	function handleColorChange(varName: string, value: string): void {
		if (!tabId || !themeName) return;

		pickerValues[varName] = value;
		SendMessage.updateVar(tabId, varName, value);

		// Debounced save to storage
		debouncedSave(themeName, varName, value);
	}

	// Debounced save function
	const debouncedSave = debounce(
		(theme: string, varName: string, value: string) => {
			saveStoredPresetVar(theme, varName, value);
		},
		500
	);

	/**
	 * Initialize the component
	 */
	onMount(async () => {
		const tab = await getActiveTab();

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
		await loadUI(tab.id, currentTheme);
		loading = false;

		// Listen for external storage changes
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area === "sync" && changes.theme_presets && tabId && themeName) {
				console.log("Theme presets changed externally. Refreshing UI...");
				refreshUI(tabId, themeName);
			}
		});
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
			{#each CSS_VARIABLES as config (config.name)}
				<div class="picker-group">
					<label for={config.name}>{config.label}</label>
					<input
						id={config.name}
						type="color"
						value={pickerValues[config.name] || "#000000"}
						oninput={(e) =>
							handleColorChange(
								config.name,
								(e.target as HTMLInputElement).value
							)}
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
