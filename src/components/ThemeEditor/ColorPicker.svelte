<script lang="ts">
	interface Props {
		label: string;
		value: string;
		inactive?: boolean;
		oninput: (value: string) => void;
	}

	let { label, value, inactive = false, oninput }: Props = $props();
</script>

<label class="picker-group" class:inactive>
	<span class="picker-label">{label}</span>
	<input
		type="color"
		{value}
		oninput={(e) => {
			if (e.target instanceof HTMLInputElement) {
				oninput(e.target.value);
			}
		}}
	/>
</label>

<style>
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
</style>
