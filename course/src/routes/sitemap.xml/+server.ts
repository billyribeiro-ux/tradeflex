import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { posts } from '$lib/blog/posts';
import { coursePages } from '$lib/course/manifest';

const MARKETING_PATHS = [
	'/',
	'/pricing',
	'/courses',
	'/alerts-preview',
	'/blog',
	'/ebook',
	'/contact'
];

export const GET: RequestHandler = () => {
	const origin = env.ORIGIN ?? 'https://tradeflex.app';
	const today = new Date().toISOString().slice(0, 10);

	const urls = [
		...MARKETING_PATHS.map((path) => ({ loc: `${origin}${path}`, lastmod: today })),
		...posts.map((p) => ({ loc: `${origin}/blog/${p.slug}`, lastmod: p.publishedAt })),
		...coursePages.map((p) => ({ loc: `${origin}${p.href}`, lastmod: today }))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
