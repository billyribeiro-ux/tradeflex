<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>4.3 Admin inbox — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 4 · Contacts CRUD"
	title="4.3 · Admin inbox + unsubscribe"
	lede="A paginated staff view and a per-row unsubscribe action. Every action is role-gated and audited — the same pattern you'll use for every admin list in the app."
>
	<section>
		<h2>The load function</h2>
		<CodeBlock title="src/routes/admin/marketing/+page.server.ts" lang="ts">
{`export const load: PageServerLoad = async ({ locals, url }) => {
  const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
  const pageSize = 50;
  const contacts = await contactsService.list(locals.caller, {
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
  return { contacts, page, pageSize };
};`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				Authorization is inside the service, not the load. If we ever add a CLI, a scheduled job, or a
				remote function that lists contacts, the role check travels with the caller — we can't
				accidentally forget it in the route.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The unsubscribe action</h2>
		<CodeBlock title="same file" lang="ts">
{`const idSchema = z.object({ id: z.string().min(1) });

export const actions: Actions = {
  unsubscribe: async ({ request, locals }) => {
    const form = await request.formData();
    const parsed = idSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail(400, { error: 'invalid' });
    await contactsService.unsubscribe(locals.caller, parsed.data.id);
    return { ok: true };
  }
};`}
		</CodeBlock>
	</section>

	<section>
		<h2>The service side of unsubscribe</h2>
		<CodeBlock title="contactsService.unsubscribe" lang="ts">
{`async unsubscribe(caller: Caller, id: string) {
  assertRole(caller, 'owner', 'admin', 'support');
  await db.update(contact)
    .set({ optedIn: false, unsubscribedAt: new Date() })
    .where(eq(contact.id, id));
  await writeAudit(caller, {
    action: 'contact.unsubscribe',
    targetKind: 'contact',
    targetId: id
  });
}`}
		</CodeBlock>
		<Aside type="note">
			<p>
				<code>assertRole</code> + <code>writeAudit</code> bookend every mutation. We do not catch and
				swallow — if the caller is unauthorized, the action fails and the route surfaces it. If audit
				fails, the transaction fails. That tight pairing is the whole point of the service layer.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Recap</h2>
		<ul>
			<li>Authorization + audit live inside the service.</li>
			<li>Routes parse and call — they don't police.</li>
			<li>Pagination is a query param, not an API flag — bookmarks work.</li>
		</ul>
		<h3>Up next</h3>
		<p>Module 5 picks up Stripe. The pattern stays the same: dashboard, CLI, then code.</p>
	</section>
</CoursePage>
