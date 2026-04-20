<script lang="ts">
	import { page } from '$app/state';
	import { courseModules } from '$lib/course/manifest';

	const currentHref = $derived(page.url.pathname);
</script>

<nav class="sidebar" aria-label="Course navigation">
	<ol class="modules">
		{#each courseModules as m (m.key)}
			<li class="module">
				<details open={m.pages.some((p) => p.href === currentHref) || m.order === 0}>
					<summary>
						<span class="moduleOrder">
							{#if m.order === 99}★{:else}{String(m.order).padStart(2, '0')}{/if}
						</span>
						<span class="moduleTitle">{m.title}</span>
					</summary>
					<ul>
						{#each m.pages as p (p.href)}
							<li>
								<a href={p.href} class:active={p.href === currentHref} aria-current={p.href === currentHref ? 'page' : undefined}>
									{p.title}
								</a>
							</li>
						{:else}
							<li class="pending">Coming up</li>
						{/each}
					</ul>
				</details>
			</li>
		{/each}
	</ol>
</nav>

<style>
	.sidebar {
		padding: var(--space-5) var(--space-4);
		font-size: var(--fs-sm);
	}

	.modules {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	summary {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--dur-1) var(--ease-out-expo);
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::before {
		content: '▸';
		font-size: 10px;
		color: var(--color-text-subtle);
		transition: transform var(--dur-2) var(--ease-out-expo);
	}

	details[open] summary::before {
		transform: rotate(90deg);
	}

	summary:hover {
		background: var(--color-surface-2);
	}

	.moduleOrder {
		font-family: var(--ff-mono);
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		min-width: 1.5em;
	}

	.moduleTitle {
		flex: 1;
	}

	details ul {
		list-style: none;
		padding: 0;
		margin: 4px 0 10px 14px;
		border-left: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	details ul li a,
	details ul li.pending {
		display: block;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
		transition: background var(--dur-1) var(--ease-out-expo), color var(--dur-1) var(--ease-out-expo);
	}

	details ul li a:hover {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	details ul li a.active {
		background: color-mix(in oklab, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
		font-weight: 500;
	}

	.pending {
		opacity: 0.5;
		font-style: italic;
	}
</style>
