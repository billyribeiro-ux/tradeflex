<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editingLessonId = $state<string | null>(null);
	let showLessonForm = $state(false);
</script>

<svelte:head><title>{data.course.title} — Admin</title></svelte:head>

<header class="hd">
	<div>
		<a class="back" href="/admin/courses">← All courses</a>
		<h1>{data.course.title}</h1>
	</div>
	<div class="status-row">
		<span class="status" data-status={data.course.status}>{data.course.status}</span>
		{#if data.course.status === 'draft'}
			<form method="post" action="?/publish" use:enhance>
				<button type="submit">Publish</button>
			</form>
		{:else if data.course.status === 'published'}
			<form method="post" action="?/unpublish" use:enhance>
				<button type="submit">Unpublish</button>
			</form>
			<form method="post" action="?/archive" use:enhance>
				<button type="submit" class="subtle">Archive</button>
			</form>
		{/if}
	</div>
</header>

{#if form && 'message' in form && form.message}
	<p class="err">{form.message}</p>
{/if}

<section class="block">
	<h2>Details</h2>
	<form method="post" action="?/update" use:enhance>
		<div class="grid">
			<label>
				Slug
				<input name="slug" value={data.course.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
			</label>
			<label>
				Title
				<input name="title" value={data.course.title} minlength="3" />
			</label>
			<label>
				Tagline
				<input name="tagline" value={data.course.tagline} />
			</label>
			<label>
				Price (USD)
				<input
					name="priceDollars"
					type="number"
					min="0"
					step="1"
					value={(data.course.priceCents / 100).toFixed(0)}
				/>
			</label>
			<label class="full">
				Summary
				<textarea name="summary" rows="4">{data.course.summary}</textarea>
			</label>
		</div>
		<button type="submit">Save</button>
	</form>
</section>

<section class="block">
	<div class="bhead">
		<h2>Lessons ({data.lessons.length})</h2>
		<button type="button" onclick={() => (showLessonForm = !showLessonForm)}>
			{showLessonForm ? 'Cancel' : 'New lesson'}
		</button>
	</div>
	{#if showLessonForm}
		<form method="post" action="?/createLesson" use:enhance>
			<div class="grid">
				<label>
					Slug
					<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
				</label>
				<label>
					Title
					<input name="title" required minlength="3" />
				</label>
				<label>
					Bunny video GUID
					<input name="bunnyVideoGuid" placeholder="aabbccdd-…" />
				</label>
				<label>
					Duration (seconds)
					<input name="durationSeconds" type="number" min="0" value="0" />
				</label>
				<label class="full">
					Summary
					<textarea name="summary" rows="3"></textarea>
				</label>
			</div>
			<button type="submit">Create draft lesson</button>
		</form>
	{/if}

	<table class="lessons">
		<thead>
			<tr>
				<th>#</th>
				<th>Lesson</th>
				<th>Video</th>
				<th>Duration</th>
				<th>Status</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.lessons as l}
				{@const editing = editingLessonId === l.id}
				<tr class:editing>
					<td>{l.position}</td>
					<td>
						{#if editing}
							<form method="post" action="?/updateLesson" use:enhance class="inline">
								<input type="hidden" name="lessonId" value={l.id} />
								<input name="title" value={l.title} />
								<input name="slug" value={l.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
								<input name="bunnyVideoGuid" value={l.bunnyVideoGuid ?? ''} />
								<input name="durationSeconds" type="number" value={l.durationSeconds} />
								<input name="position" type="number" value={l.position} />
								<button type="submit">Save</button>
								<button type="button" onclick={() => (editingLessonId = null)}>Cancel</button>
							</form>
						{:else}
							<strong>{l.title}</strong>
							<div class="slug">/{l.slug}</div>
						{/if}
					</td>
					<td>{l.bunnyVideoGuid ? l.bunnyVideoGuid.slice(0, 8) + '…' : '—'}</td>
					<td>{Math.round(l.durationSeconds / 60)}m</td>
					<td><span class="status" data-status={l.status}>{l.status}</span></td>
					<td class="row-actions">
						{#if !editing}
							<button type="button" onclick={() => (editingLessonId = l.id)}>Edit</button>
							{#if l.status === 'draft'}
								<form method="post" action="?/publishLesson" use:enhance class="inline">
									<input type="hidden" name="lessonId" value={l.id} />
									<button type="submit">Publish</button>
								</form>
							{:else}
								<form method="post" action="?/unpublishLesson" use:enhance class="inline">
									<input type="hidden" name="lessonId" value={l.id} />
									<button type="submit">Unpublish</button>
								</form>
							{/if}
							<form method="post" action="?/deleteLesson" use:enhance class="inline">
								<input type="hidden" name="lessonId" value={l.id} />
								<button
									type="submit"
									class="danger"
									onclick={(e) => {
										if (!confirm('Delete this lesson?')) e.preventDefault();
									}}>Delete</button
								>
							</form>
						{/if}
					</td>
				</tr>
			{/each}
			{#if data.lessons.length === 0}
				<tr>
					<td colspan="6" class="empty">No lessons yet. Click "New lesson" above.</td>
				</tr>
			{/if}
		</tbody>
	</table>
</section>

<section class="block">
	<h2>Enrollments ({data.enrollments.length})</h2>
	<form method="post" action="?/grantEnrollment" use:enhance class="enroll-form">
		<input name="email" type="email" required placeholder="member@example.com" />
		<button type="submit">Grant access</button>
	</form>
	<p class="hint">
		Active Trade Flex members get access automatically — this form is for comp/refund grants and
		off-platform purchases.
	</p>
	<table class="enrollments">
		<thead>
			<tr>
				<th>Email</th>
				<th>Source</th>
				<th>Granted</th>
				<th>Expires</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.enrollments as e}
				<tr>
					<td>{e.email ?? e.userId}</td>
					<td>{e.source}</td>
					<td>{new Date(e.grantedAt).toLocaleDateString()}</td>
					<td
						>{e.accessExpiresAt ? new Date(e.accessExpiresAt).toLocaleDateString() : 'lifetime'}</td
					>
					<td>
						<form method="post" action="?/revokeEnrollment" use:enhance class="inline">
							<input type="hidden" name="enrollmentId" value={e.id} />
							<button
								type="submit"
								class="danger"
								onclick={(ev) => {
									if (!confirm('Revoke this enrollment?')) ev.preventDefault();
								}}>Revoke</button
							>
						</form>
					</td>
				</tr>
			{/each}
			{#if data.enrollments.length === 0}
				<tr>
					<td colspan="5" class="empty">No enrollments yet.</td>
				</tr>
			{/if}
		</tbody>
	</table>
</section>

<section class="danger-zone">
	<h2>Danger zone</h2>
	<form method="post" action="?/deleteCourse" use:enhance>
		<button
			type="submit"
			class="danger"
			onclick={(e) => {
				if (!confirm(`Delete course "${data.course.title}"? Lessons and enrollments cascade.`)) {
					e.preventDefault();
				}
			}}>Delete course</button
		>
	</form>
</section>

<style>
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: var(--space-5);
		gap: var(--space-3);
	}
	.hd h1 {
		font-size: var(--fs-3xl);
		margin: 0;
	}
	.back {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--fs-sm);
	}
	.status-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
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
	.err {
		color: var(--color-danger);
		padding: var(--space-3);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-sm);
		background: color-mix(in oklab, var(--color-danger) 10%, transparent);
	}
	.block {
		margin-bottom: var(--space-6);
		padding: var(--space-5);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}
	.block h2 {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-3);
	}
	.bhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}
	.grid .full {
		grid-column: 1 / -1;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--fs-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	input,
	textarea {
		padding: var(--space-2);
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-size: var(--fs-sm);
		text-transform: none;
		letter-spacing: 0;
		font-family: inherit;
	}
	button {
		padding: var(--space-2) var(--space-4);
		background: var(--color-accent);
		border: 0;
		border-radius: var(--radius-sm);
		color: var(--color-on-accent, #000);
		font-weight: 600;
		cursor: pointer;
		font-size: var(--fs-sm);
	}
	button.subtle {
		background: var(--color-surface-2);
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-weight: 500;
	}
	button.danger {
		background: transparent;
		border: 1px solid var(--color-danger);
		color: var(--color-danger);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-sm);
	}
	th {
		text-align: left;
		color: var(--color-text-subtle);
		font-weight: 500;
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}
	td {
		padding: var(--space-2);
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}
	.slug {
		color: var(--color-text-subtle);
		font-size: var(--fs-xs);
		font-family: var(--font-mono, monospace);
	}
	.row-actions {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	.row-actions button {
		padding: var(--space-1) var(--space-2);
	}
	.inline {
		display: inline-flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		align-items: center;
	}
	tr.editing td {
		background: color-mix(in oklab, var(--color-accent) 6%, transparent);
	}
	.enroll-form {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-2);
	}
	.enroll-form input {
		flex: 1;
	}
	.hint {
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
		margin: 0 0 var(--space-3);
	}
	.empty {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-5);
	}
	.danger-zone {
		margin-top: var(--space-7);
		padding: var(--space-4);
		border: 1px dashed var(--color-danger);
		border-radius: var(--radius-md);
	}
	.danger-zone h2 {
		font-size: var(--fs-md);
		margin: 0 0 var(--space-3);
		color: var(--color-danger);
	}
</style>
