<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const values = $derived(form && 'values' in form && form.values ? form.values : null);
</script>

<svelte:head><title>Courses — Admin</title></svelte:head>

<header class="hd">
	<h1>Courses</h1>
	<p>Standalone paid courses with their own lessons and enrollment.</p>
</header>

<section class="new">
	<h2>Create a new course</h2>
	<form method="post" action="?/create" use:enhance>
		<label>
			Slug
			<input
				name="slug"
				required
				pattern="[a-z0-9]+(-[a-z0-9]+)*"
				placeholder="price-action-simplified"
				value={values?.slug ?? ''}
			/>
		</label>
		<label>
			Title
			<input
				name="title"
				required
				minlength="3"
				placeholder="Price Action Simplified"
				value={values?.title ?? ''}
			/>
		</label>
		<label>
			Tagline
			<input name="tagline" placeholder="Read charts like a pro" value={values?.tagline ?? ''} />
		</label>
		<label>
			Price (USD)
			<input
				name="priceDollars"
				type="number"
				min="0"
				step="1"
				value={values?.priceDollars ?? 799}
			/>
		</label>
		<button type="submit">Create draft</button>
	</form>
	{#if form && 'message' in form && form.message}
		<p class="err">{form.message}</p>
	{/if}
</section>

<div class="grid">
	{#each data.courses as c}
		<article class="card">
			<div class="top">
				<h2>{c.title}</h2>
				<span class="status" data-status={c.status}>{c.status}</span>
			</div>
			<p class="tagline">{c.tagline || '—'}</p>
			<dl>
				<div>
					<dt>Slug</dt>
					<dd>{c.slug}</dd>
				</div>
				<div>
					<dt>Price</dt>
					<dd>${(c.priceCents / 100).toFixed(0)}</dd>
				</div>
				<div>
					<dt>Updated</dt>
					<dd>{new Date(c.updatedAt).toLocaleDateString()}</dd>
				</div>
			</dl>
			<div class="actions">
				<a class="btn" href="/admin/courses/{c.id}">Open</a>
			</div>
		</article>
	{/each}
	{#if data.courses.length === 0}
		<p class="empty">No courses yet. Create the first one above.</p>
	{/if}
</div>

<style>
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.hd p {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 var(--space-5);
	}
	.new {
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.new h2 {
		font-size: var(--fs-md);
		margin: 0 0 var(--space-3);
	}
	.new form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		align-items: end;
	}
	.new label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.new input {
		padding: var(--space-2);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-size: var(--fs-sm);
		text-transform: none;
		letter-spacing: 0;
	}
	.new button {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-on-accent, #000);
		font-weight: 600;
		cursor: pointer;
	}
	.err {
		color: var(--color-danger);
		margin: var(--space-3) 0 0;
		font-size: var(--fs-sm);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-4);
	}
	.card {
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}
	.card h2 {
		font-size: var(--fs-lg);
		margin: 0;
	}
	.tagline {
		color: var(--color-text-muted);
		margin: 0 0 var(--space-3);
		font-size: var(--fs-sm);
	}
	.status {
		padding: 2px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: var(--color-surface-2);
		color: var(--color-text-muted);
	}
	.status[data-status='published'] {
		background: color-mix(in oklab, var(--color-success) 20%, transparent);
		color: var(--color-success);
	}
	.status[data-status='archived'] {
		background: color-mix(in oklab, var(--color-warning) 20%, transparent);
		color: var(--color-warning);
	}
	dl {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--space-2);
		margin: 0 0 var(--space-4);
	}
	dt {
		font-size: var(--fs-xs);
		color: var(--color-text-subtle);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	dd {
		margin: 0;
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	.btn {
		display: inline-block;
		padding: var(--space-2) var(--space-4);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.empty {
		color: var(--color-text-muted);
		padding: var(--space-5);
		grid-column: 1 / -1;
		text-align: center;
	}
</style>
