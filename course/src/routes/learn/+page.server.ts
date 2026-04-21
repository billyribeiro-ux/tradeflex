import type { PageServerLoad } from './$types';
import { coursesService } from '$lib/server/services/courses';
import { subscriptionsService } from '$lib/server/services/subscriptions';

export const load: PageServerLoad = async ({ locals }) => {
	const allPublished = await coursesService.listPublic();
	const hasMembership = await subscriptionsService.hasActiveEntitlement(locals.caller);

	let enrolledIds = new Set<string>();
	if (locals.caller.userId && !hasMembership) {
		const enrolled = await coursesService.listEnrollmentsForCaller(locals.caller);
		enrolledIds = new Set(enrolled.map((c) => c.id));
	}

	const courses = allPublished.map((c) => ({
		...c,
		hasAccess: hasMembership || enrolledIds.has(c.id)
	}));

	return {
		courses,
		hasMembership,
		signedIn: !!locals.caller.userId
	};
};
