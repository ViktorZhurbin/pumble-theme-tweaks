<script lang="ts">
	import { onMount } from "svelte";
	import { Storage } from "@/lib/storage";
	import { CSS_VARIABLES } from "@/lib/config";
	import { SendMessage } from "@/lib/messaging";
	import { debouncedSave } from "./helpers/debouncedSave";
	import { getActiveTab } from "./helpers/getActiveTab";
	import { getPickerValues } from "./helpers/loadPickerValues";

	let themeName = $state<string | null>(null);
	let tabId = $state<number | null>(null);
	let error = $state<string | null>(null);
	let pickerValues = $state<Record<string, string>>({});
	let loading = $state(true);

	async function handleReset() {
		if (!tabId || !themeName) return;

		await Storage.deletePreset(themeName);

		await SendMessage.resetVars(tabId);
		const values = await getPickerValues(tabId, themeName);

		pickerValues = values;
	}

	function handleColorChange(varName: string, value: string) {
		if (!tabId || !themeName) return;

		pickerValues[varName] = value;

		SendMessage.updateVar(tabId, varName, value);

		debouncedSave(themeName, varName, value);
	}

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
		const values = await getPickerValues(tabId, themeName);

		pickerValues = values;
		loading = false;

		// Listen for external storage changes
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area === "sync" && changes.theme_presets && tabId && themeName) {
				console.log("Theme presets changed externally. Refreshing UI...");
				getPickerValues(tabId, themeName).then((values) => {
					pickerValues = values;
				});
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
			{#each CSS_VARIABLES as config (config.propertyName)}
				<div class="picker-group">
					<label for={config.propertyName}>{config.label}</label>
					<input
						id={config.propertyName}
						type="color"
						value={pickerValues[config.propertyName] || "#000000"}
						oninput={(e) =>
							handleColorChange(
								config.propertyName,
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
