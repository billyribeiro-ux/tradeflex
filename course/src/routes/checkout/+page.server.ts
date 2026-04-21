import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { cartService } from '$lib/server/services/cart';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies, locals, url }) => {
	const add = url.searchParams.get('add');
	if (add) {
		cartService.add(cookies, { priceId: add, qty: 1 });
		throw redirect(303, '/checkout');
	}
	const items = cartService.read(cookies);
	const summary = await cartService.summarize(items);

	let email: string | null = null;
	let name: string | null = null;
	if (locals.caller.userId) {
		const rows = await db
			.select({ email: userTable.email, name: userTable.name })
			.from(userTable)
			.where(eq(userTable.id, locals.caller.userId))
			.limit(1);
		email = rows[0]?.email ?? null;
		name = rows[0]?.name ?? null;
	}

	return {
		summary,
		signedIn: !!locals.caller.userId,
		email,
		name
	};
};
