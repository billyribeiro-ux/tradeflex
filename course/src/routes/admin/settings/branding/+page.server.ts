import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';
import { settingsService } from '$lib/server/services/settings';

const KEYS = [
	{
		key: 'BRAND_ACCENT_HEX',
		label: 'Accent color (hex)',
		help: 'e.g. #00d09c — used on CTAs and focus rings.'
	},
	{
		key: 'BRAND_LOGO_MARK',
		label: 'Logo mark (SVG snippet)',
		help: 'Inline SVG replacing the default mark.'
	},
	{
		key: 'BRAND_DISPLAY_NAME',
		label: 'Display name',
		help: 'Shown in <title>, emails, and the nav.'
	},
	{
		key: 'BRAND_TAGLINE',
		label: 'Tagline',
		help: 'Used on the landing hero; falls back to the built-in copy.'
	}
] as const;

export const load: PageServerLoad = async ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin');
	const values = await Promise.all(
		KEYS.map(async (k) => ({ ...k, value: (await settingsService.get(k.key)) ?? '' }))
	);
	return { values };
};
