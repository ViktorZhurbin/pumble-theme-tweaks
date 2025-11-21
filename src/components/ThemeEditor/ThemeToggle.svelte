<script lang="ts">
	interface Props {
		checked: boolean;
		onchange: (checked: boolean) => void;
	}

	let { checked = $bindable(), onchange }: Props = $props();
</script>

<div class="toggle-container">
	<label for="toggle-overrides" class="toggle-label">
		<input
			id="toggle-overrides"
			type="checkbox"
			bind:checked
			onchange={() => onchange(checked)}
		/>
		{checked ? "Tweaks ON" : "Tweaks OFF"}
	</label>
</div>

<style>
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
</style>
