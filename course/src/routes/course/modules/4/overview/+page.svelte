<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>4.1 Overview — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 4 · Contacts CRUD"
	title="4.1 · Overview"
	lede="Module 4 ships the first real feature on top of the service layer: capturing a marketing lead, storing it, listing it in the admin, and unsubscribing on request — every step audited."
>
	<section>
		<h2>Why contacts first</h2>
		<p>
			Contacts are the simplest domain object that exercises everything Modules 1–3 built: a schema
			migration, a public <code>POST</code> endpoint, a service that dedupes input, role-gated reads,
			and audit on every mutation. If this works, every other feature has a template.
		</p>
	</section>

	<section>
		<h2>What you ship</h2>
		<ul>
			<li>
				<code>contact</code> table with <code>email</code>, <code>source</code>,
				<code>optedIn</code>, timestamps.
			</li>
			<li>
				<code>contactsService.captureLead</code> — idempotent on email, lowercases, validates format.
			</li>
			<li>
				<code>POST /api/leads</code> accepting JSON or form-data, callable from the landing ebook CTA.
			</li>
			<li><code>contactsService.list</code> — staff-only read, paginated.</li>
			<li>
				<code>/admin/marketing</code> — 50-row paginated inbox with per-row unsubscribe action.
			</li>
			<li>
				Audit entries: <code>contact.unsubscribe</code> (capture is intentionally not audited — too noisy).
			</li>
		</ul>
	</section>

	<section>
		<h2>The "don't audit inbound capture" rule</h2>
		<Aside type="note">
			<p>
				Every mutation <em>by staff</em> lands in audit. The public capture endpoint does not —
				otherwise a scraper hammering the form would drown the audit log. Instead, we emit a
				<code>domain_event</code>
				row for capture (a separate, high-volume table designed to be rolled up), and reserve audit for
				anything a human with a role did.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Contacts = the smallest feature that exercises the full stack.</li>
			<li>
				Audit is for human actions. High-volume or anonymous writes go to <code>domain_event</code>.
			</li>
			<li>
				Idempotent capture matters — the ebook form can be retried by CDN, by the user, by both.
			</li>
		</ul>
		<h3>Next up</h3>
		<p><a href={resolve('/course/modules/4/schema-and-service')}>4.2 · Schema + service →</a></p>
	</section>
</CoursePage>
