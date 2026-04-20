import { error } from '@sveltejs/kit';
import { postBySlug } from '$lib/blog/posts';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const post = postBySlug(params.slug);
	if (!post) throw error(404, 'Post not found');
	return { post };
};
