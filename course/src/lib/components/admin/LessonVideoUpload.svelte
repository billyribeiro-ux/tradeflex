<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	interface Props {
		lessonId: string;
		existingGuid: string | null;
	}
	let { lessonId, existingGuid }: Props = $props();

	let fileEl: HTMLInputElement | null = $state(null);
	let status = $state<'idle' | 'uploading' | 'done' | 'error'>('idle');
	let progress = $state(0);
	let message = $state<string | null>(null);

	async function upload() {
		const file = fileEl?.files?.[0];
		if (!file) {
			message = 'Choose a video file first.';
			return;
		}
		status = 'uploading';
		progress = 0;
		message = null;

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `/api/admin/lesson/${encodeURIComponent(lessonId)}/video`);
		xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
		xhr.upload.onprogress = (ev) => {
			if (ev.lengthComputable) progress = Math.round((ev.loaded / ev.total) * 100);
		};
		xhr.onerror = () => {
			status = 'error';
			message = 'Network error during upload.';
		};
		xhr.onload = async () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				status = 'done';
				message = 'Upload complete. Bunny is transcoding in the background.';
				await invalidateAll();
			} else {
				status = 'error';
				message = xhr.responseText || `Upload failed (${xhr.status})`;
			}
		};
		xhr.send(file);
	}
</script>

<div class="wrap">
	{#if existingGuid}
		<p class="meta">
			Current video GUID: <code>{existingGuid}</code>
		</p>
	{:else}
		<p class="meta">No video linked yet.</p>
	{/if}

	<div class="row">
		<input
			bind:this={fileEl}
			type="file"
			accept="video/mp4,video/quicktime,video/webm,video/*"
			disabled={status === 'uploading'}
		/>
		<button type="button" class="btn" onclick={upload} disabled={status === 'uploading'}>
			{existingGuid ? 'Replace video' : 'Upload video'}
		</button>
	</div>

	{#if status === 'uploading'}
		<progress value={progress} max="100"></progress>
		<p class="meta">Uploading {progress}%…</p>
	{:else if status === 'done'}
		<p class="ok">{message}</p>
	{:else if status === 'error'}
		<p class="err">{message}</p>
	{/if}
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}
	.btn {
		padding: var(--space-2) var(--space-3);
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		border: 0;
		border-radius: var(--radius-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.meta {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--fs-sm);
	}
	.meta code {
		background: var(--color-surface-2);
		padding: 0 var(--space-1);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
	}
	progress {
		width: 100%;
		height: 8px;
	}
	.ok {
		margin: 0;
		color: var(--color-success);
		font-size: var(--fs-sm);
	}
	.err {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--fs-sm);
	}
</style>
