import { fail, error } from '@sveltejs/kit';
import { settingsService } from '$lib/server/services/settings';
import { assertRole } from '$lib/server/authz/caller';
import type { Actions, PageServerLoad } from './$types';

const KNOWN_KEYS: {
	key: string;
	label: string;
	encrypted: boolean;
	group: string;
	help: string;
}[] = [
	{
		key: 'STRIPE_SECRET_KEY',
		label: 'Stripe Secret Key',
		encrypted: true,
		group: 'Stripe',
		help: 'sk_test_… for dev, sk_live_… for prod. Find it in Stripe → Developers → API keys.'
	},
	{
		key: 'STRIPE_WEBHOOK_SECRET',
		label: 'Stripe Webhook Signing Secret',
		encrypted: true,
		group: 'Stripe',
		help: 'whsec_… from `stripe listen` or the Dashboard webhook endpoint.'
	},
	{
		key: 'PUBLIC_STRIPE_PUBLISHABLE_KEY',
		label: 'Stripe Publishable Key',
		encrypted: false,
		group: 'Stripe',
		help: 'pk_test_… — safe to expose client-side.'
	},
	{
		key: 'RESEND_API_KEY',
		label: 'Resend API Key',
		encrypted: true,
		group: 'Email',
		help: 're_… from resend.com → API Keys. Used for transactional + marketing email.'
	},
	{
		key: 'RESEND_FROM',
		label: 'Default From Address',
		encrypted: false,
		group: 'Email',
		help: 'e.g. "Trade Flex <hello@send.tradeflex.app>"'
	},
	{
		key: 'BUNNY_STREAM_LIBRARY_ID',
		label: 'Bunny Stream Library ID',
		encrypted: false,
		group: 'Video',
		help: 'Numeric ID of your Bunny Stream library.'
	},
	{
		key: 'BUNNY_STREAM_API_KEY',
		label: 'Bunny Stream API Key',
		encrypted: true,
		group: 'Video',
		help: 'Library access key. Used for signed playback URLs.'
	},
	{
		key: 'GITHUB_CLIENT_ID',
		label: 'GitHub OAuth Client ID',
		encrypted: false,
		group: 'OAuth',
		help: 'From github.com/settings/developers → your OAuth app.'
	},
	{
		key: 'GITHUB_CLIENT_SECRET',
		label: 'GitHub OAuth Client Secret',
		encrypted: true,
		group: 'OAuth',
		help: 'Client secret from the same page. Rotate by deleting and creating new.'
	}
];

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin');
	const existing = await settingsService.listMasked(locals.caller);
	const byKey = new Map(existing.map((r) => [r.key, r]));

	const rows = KNOWN_KEYS.map((def) => {
		const row = byKey.get(def.key);
		return {
			...def,
			configured: !!row,
			mask: row?.mask ?? null,
			updatedAt: row?.updatedAt?.toISOString() ?? null,
			source: row ? 'database' : 'env-fallback'
		};
	});

	return { rows };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const fd = await request.formData();
		const key = fd.get('key')?.toString() ?? '';
		const value = fd.get('value')?.toString() ?? '';
		const def = KNOWN_KEYS.find((d) => d.key === key);

		if (!def) return fail(400, { key, message: 'Unknown key.' });
		if (!value) return fail(400, { key, message: 'Value is required.' });

		try {
			if (def.encrypted) {
				assertRole(locals.caller, 'owner');
				await settingsService.setEncrypted(locals.caller, key, value);
			} else {
				assertRole(locals.caller, 'owner', 'admin');
				await settingsService.setPlain(locals.caller, key, value);
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Save failed.';
			throw error(400, msg);
		}

		return { success: true, key };
	}
};
