<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Branding — Admin</title></svelte:head>

<header class="hd">
	<h1>Branding</h1>
	<p>
		Per-tenant overrides. Empty fields fall back to the built-in PE7 tokens in
		<code>src/lib/styles/tokens.css</code>.
	</p>
</header>

<div class="note">
	Values below are read from the settings service. Wire the form actions from
	<a href="/admin/settings/integrations">Integrations</a> as a reference — same pattern, just plain-text
	writes. Editing UI lands alongside the feature-flag admin in Module 13.
</div>

<dl class="vals">
	{#each data.values as v}
		<div class="row">
			<dt>
				<span class="label">{v.label}</span>
				<code class="key">{v.key}</code>
			</dt>
			<dd>
				{#if v.value}
					<code class="val">{v.value}</code>
				{:else}
					<span class="empty">using default</span>
				{/if}
				<span class="help">{v.help}</span>
			</dd>
		</div>
	{/each}
</dl>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-4);
	}
	code {
		font-family: var(--ff-mono);
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
		font-size: 0.9em;
	}
	.note {
		padding: var(--space-4);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		margin-bottom: var(--space-5);
	}
	.note a {
		color: var(--color-accent);
	}
	.vals {
		margin: 0;
	}
	.row {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border-top: 1px solid var(--color-border);
	}
	.row:last-child {
		border-bottom: 1px solid var(--color-border);
	}
	dt {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.label {
		font-weight: 500;
	}
	.key {
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
	}
	dd {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.val {
		font-family: var(--ff-mono);
		font-size: var(--fs-sm);
		word-break: break-all;
	}
	.empty {
		color: var(--color-text-subtle);
		font-size: var(--fs-sm);
	}
	.help {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
</style>
