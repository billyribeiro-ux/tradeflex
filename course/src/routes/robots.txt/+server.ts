import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = () => {
	const origin = env.ORIGIN ?? 'https://tradeflex.app';
	const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /account/
Disallow: /api/
Disallow: /login
Disallow: /signup

Sitemap: ${origin}/sitemap.xml
`;
	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
