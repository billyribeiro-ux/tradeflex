<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as tus from 'tus-js-client';

	interface Props {
		lessonId: string;
		existingGuid: string | null;
	}
	let { lessonId, existingGuid }: Props = $props();

	let fileEl: HTMLInputElement | null = $state(null);
	let status = $state<'idle' | 'uploading' | 'done' | 'error'>('idle');
	let progress = $state(0);
	let message = $state<string | null>(null);

	/**
	 * Vercel's edge ingress caps request bodies around 4.5 MB. Anything below
	 * the threshold uses the simple streaming endpoint; everything above goes
	 * through TUS direct-to-Bunny so the bytes never touch our server.
	 */
	const SERVER_STREAM_LIMIT = 4 * 1024 * 1024;

	async function upload() {
		const file = fileEl?.files?.[0];
		if (!file) {
			message = 'Choose a video file first.';
			return;
		}
		status = 'uploading';
		progress = 0;
		message = null;

		try {
			if (file.size <= SERVER_STREAM_LIMIT) {
				await uploadViaServer(file);
			} else {
				await uploadViaTus(file);
			}
			status = 'done';
			message = 'Upload complete. Bunny is transcoding in the background.';
			await invalidateAll();
		} catch (err) {
			status = 'error';
			message = err instanceof Error ? err.message : String(err);
		}
	}

	function uploadViaServer(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `/api/admin/lesson/${encodeURIComponent(lessonId)}/video`);
			xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
			xhr.upload.onprogress = (ev) => {
				if (ev.lengthComputable) progress = Math.round((ev.loaded / ev.total) * 100);
			};
			xhr.onerror = () => reject(new Error('Network error during upload.'));
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) resolve();
				else reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
			};
			xhr.send(file);
		});
	}

	async function uploadViaTus(file: File): Promise<void> {
		const presignRes = await fetch(
			`/api/admin/lesson/${encodeURIComponent(lessonId)}/video/direct`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: file.name })
			}
		);
		if (!presignRes.ok) {
			throw new Error((await presignRes.text()) || `Presign failed (${presignRes.status})`);
		}
		const ticket = (await presignRes.json()) as {
			videoGuid: string;
			libraryId: string;
			endpoint: string;
			authorizationSignature: string;
			authorizationExpire: number;
		};

		await new Promise<void>((resolve, reject) => {
			const upload = new tus.Upload(file, {
				endpoint: ticket.endpoint,
				retryDelays: [0, 1000, 3000, 5000, 10_000],
				chunkSize: 8 * 1024 * 1024,
				headers: {
					AuthorizationSignature: ticket.authorizationSignature,
					AuthorizationExpire: String(ticket.authorizationExpire),
					VideoId: ticket.videoGuid,
					LibraryId: ticket.libraryId
				},
				metadata: {
					filetype: file.type || 'application/octet-stream',
					title: file.name
				},
				onError: (error) => reject(error),
				onProgress: (bytesUploaded, bytesTotal) => {
					progress = Math.round((bytesUploaded / bytesTotal) * 100);
				},
				onSuccess: () => resolve()
			});
			upload.start();
		});
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
	<p class="meta hint">
		Files under 4 MB stream through the server; larger files upload directly to Bunny via TUS
		(resumable).
	</p>
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
	.meta.hint {
		font-size: var(--fs-xs);
		opacity: 0.8;
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
