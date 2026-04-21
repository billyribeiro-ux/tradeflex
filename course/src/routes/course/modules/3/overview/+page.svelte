<script lang="ts">
	import { resolve } from '$app/paths';
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
	import FileTree from '$lib/components/course/FileTree.svelte';
</script>

<svelte:head><title>3.1 Overview — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 3 · User auth"
	title="3.1 · Overview"
	lede="Module 3 turns the plumbing from Modules 1–2 into the first user-facing surface: register, login, sign-out, and an account page that edits the profile through the service layer."
>
	<section>
		<h2>What you will ship</h2>
		<ul>
			<li>
				A styled <code>/login</code> with email-password + GitHub, under an <code>(auth)</code> group
				layout.
			</li>
			<li>A <code>/register</code> with the same look and a 10-character minimum password.</li>
			<li>
				An <code>/account</code> page gated by a load-function redirect; uses
				<code>profileService</code>.
			</li>
			<li>
				A profile editor with Zod validation, a real audit trail, and an optimistic save toast.
			</li>
			<li>A <code>/logout</code> POST action that clears the Better Auth session cookie.</li>
		</ul>
	</section>

	<section>
		<h2>Two route groups, two layouts</h2>
		<p>
			SvelteKit's <code>(group)</code> folder syntax lets us share a layout without affecting the URL.
			We use it twice in this module:
		</p>
		<FileTree>
			{`src/routes/
├── (auth)/             ← split-screen brand + form, no main nav
│   ├── +layout.svelte
│   ├── login/
│   ├── register/
│   └── logout/
└── account/            ← top-nav member shell
    ├── +layout.svelte
    └── +page.svelte    ← profile editor
`}
		</FileTree>
		<p>
			Keeping unauthenticated surfaces in their own group makes it easy to audit: anything under <code
				>(auth)</code
			>
			is intentionally public.
		</p>
	</section>

	<section>
		<h2>What we are <em>not</em> doing yet</h2>
		<Aside type="note">
			<p>
				Password reset, magic link, and 2FA land in a later module when we wire Resend for
				transactional email. Account deletion + data export arrive in the Compliance module. We ship
				the common path first.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>
				Two route groups: <code>(auth)</code> for unauthenticated surfaces, <code>account</code> for member
				surfaces.
			</li>
			<li>Every write hits the service layer; the route only wires form to service.</li>
			<li>
				Password reset / magic link / 2FA / account deletion come later; build the common path
				first.
			</li>
		</ul>

		<h3>Next up</h3>
		<p><a href={resolve('/course/modules/3/register-and-login')}>3.2 · Register + login →</a></p>
	</section>
</CoursePage>
