import type { PageServerLoad } from './$types';
import { assertRole } from '$lib/server/authz/caller';

interface CourseSummary {
	id: string;
	title: string;
	priceUsd: number;
	students: number;
	lessons: number;
	status: 'live' | 'draft';
}

export const load: PageServerLoad = ({ locals }) => {
	assertRole(locals.caller, 'owner', 'admin', 'content', 'analyst');
	const courses: CourseSummary[] = [
		{
			id: 'price-action-simplified',
			title: 'Price Action Simplified',
			priceUsd: 799,
			students: 0,
			lessons: 48,
			status: 'draft'
		},
		{
			id: 'options-101',
			title: 'Options 101',
			priceUsd: 999,
			students: 0,
			lessons: 36,
			status: 'draft'
		}
	];
	return { courses };
};
