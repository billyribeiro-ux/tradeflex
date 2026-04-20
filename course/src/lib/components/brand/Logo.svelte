<script lang="ts">
	interface Props {
		variant?: 'mark' | 'lockup';
		size?: number;
		title?: string;
	}

	let { variant = 'lockup', size = 28, title = 'Trade Flex' }: Props = $props();
</script>

{#if variant === 'mark'}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 32 32"
		width={size}
		height={size}
		role="img"
		aria-label={title}
		class="logo-mark"
	>
		<rect x="1" y="1" width="30" height="30" rx="8" class="logo-bg" />
		<path
			d="M8 10h16M16 10v13"
			stroke="currentColor"
			stroke-width="2.4"
			stroke-linecap="round"
			class="logo-t"
		/>
		<rect x="14.4" y="6.5" width="3.2" height="4.5" rx="0.8" class="logo-candle-up" />
		<rect x="14.4" y="22.5" width="3.2" height="3.5" rx="0.8" class="logo-candle-down" />
	</svg>
{:else}
	<span class="lockup" style="--h: {size}px">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width={size}
			height={size}
			role="img"
			aria-label={title}
			class="logo-mark"
		>
			<rect x="1" y="1" width="30" height="30" rx="8" class="logo-bg" />
			<path
				d="M8 10h16M16 10v13"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				class="logo-t"
			/>
			<rect x="14.4" y="6.5" width="3.2" height="4.5" rx="0.8" class="logo-candle-up" />
			<rect x="14.4" y="22.5" width="3.2" height="3.5" rx="0.8" class="logo-candle-down" />
		</svg>
		<span class="wordmark">
			<span class="word">TRADE</span>
			<span class="word accent">FLEX</span>
		</span>
	</span>
{/if}

<style>
	.lockup {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		line-height: 1;
	}

	.wordmark {
		font-family: var(--ff-sans);
		font-weight: 700;
		letter-spacing: 0.12em;
		font-size: calc(var(--h) * 0.5);
		color: var(--color-text);
		display: inline-flex;
		gap: 0.35em;
	}

	.wordmark .accent {
		color: var(--color-accent);
	}

	.logo-bg {
		fill: var(--color-surface);
		stroke: var(--color-border);
		stroke-width: 1;
	}

	:global(:root[data-theme='dark']) .logo-bg {
		fill: var(--color-surface-2);
	}

	.logo-t {
		color: var(--color-text);
	}

	.logo-candle-up {
		fill: var(--color-accent);
	}

	.logo-candle-down {
		fill: var(--color-text-subtle);
	}
</style>
