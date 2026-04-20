/**
 * Course manifest — the single source of truth for course page ordering.
 * Sidebar, prev/next, and search all derive from this list.
 *
 * When you add a new course page, append it here in the intended reading order.
 * Route must match the file path under src/routes/course/ (without +page.svelte/+page.svx).
 */

export interface CoursePage {
	slug: string;
	href: string;
	title: string;
	module: string;
	moduleOrder: number;
	order: number;
	summary?: string;
}

export interface CourseModule {
	key: string;
	order: number;
	title: string;
	summary: string;
	pages: CoursePage[];
}

const pages: CoursePage[] = [
	{
		slug: 'cli-reference',
		href: '/course/cli-reference',
		title: 'CLI Reference',
		module: 'module-0',
		moduleOrder: 0,
		order: 0,
		summary: 'Every command you will type in this course, what it does, and what to expect.'
	},
	{
		slug: 'module-1-overview',
		href: '/course/modules/1/overview',
		title: '1.1 · Overview',
		module: 'module-1',
		moduleOrder: 1,
		order: 0,
		summary: 'What Module 1 builds, why it is ordered this way, and how to verify progress.'
	},
	{
		slug: 'module-1-repo-and-tooling',
		href: '/course/modules/1/repo-and-tooling',
		title: '1.2 · Repo + tooling',
		module: 'module-1',
		moduleOrder: 1,
		order: 1,
		summary: 'Rename the scaffold, pin tool versions, and land the docs folder under Git.'
	},
	{
		slug: 'module-1-neon-dev-branch',
		href: '/course/modules/1/neon-dev-branch',
		title: '1.3 · Neon dev branch',
		module: 'module-1',
		moduleOrder: 1,
		order: 2,
		summary: 'Create a Neon project + dev branch, wire the connection string, verify with psql.'
	},
	{
		slug: 'module-1-better-auth-schema',
		href: '/course/modules/1/better-auth-schema',
		title: '1.4 · Better Auth schema',
		module: 'module-1',
		moduleOrder: 1,
		order: 3,
		summary: 'Generate the auth tables, migrate them to Neon, and sign up your first user.'
	},
	{
		slug: 'module-1-profiles-and-authorization',
		href: '/course/modules/1/profiles-and-authorization',
		title: '1.5 · Profiles + authorization',
		module: 'module-1',
		moduleOrder: 1,
		order: 4,
		summary: 'Add a profile table, introduce the service-layer pattern, and explain why not RLS.'
	},
	{
		slug: 'module-2-overview',
		href: '/course/modules/2/overview',
		title: '2.1 · Overview',
		module: 'module-2',
		moduleOrder: 2,
		order: 0,
		summary: 'Why Module 2 hardens the data layer before a single feature ships.'
	},
	{
		slug: 'module-2-typed-env',
		href: '/course/modules/2/typed-env',
		title: '2.2 · Typed env with Zod',
		module: 'module-2',
		moduleOrder: 2,
		order: 1,
		summary: 'Parse every env var at boot so missing config crashes early, never at 3 AM.'
	},
	{
		slug: 'module-2-drizzle-service-layer',
		href: '/course/modules/2/drizzle-service-layer',
		title: '2.3 · Drizzle client + service layer',
		module: 'module-2',
		moduleOrder: 2,
		order: 2,
		summary: 'One Drizzle instance, server-only imports, and the Caller that travels with every call.'
	},
	{
		slug: 'module-2-request-pipeline',
		href: '/course/modules/2/request-pipeline',
		title: '2.4 · Request pipeline + load',
		module: 'module-2',
		moduleOrder: 2,
		order: 3,
		summary: 'hooks.server.ts: request id, logging, Caller resolution, and load functions that use them.'
	},
	{
		slug: 'module-2-remote-functions',
		href: '/course/modules/2/remote-functions',
		title: '2.5 · Remote functions + actions',
		module: 'module-2',
		moduleOrder: 2,
		order: 4,
		summary: 'When to reach for a form action, when to reach for a remote function, and why never a REST endpoint.'
	},
	{
		slug: 'module-3-overview',
		href: '/course/modules/3/overview',
		title: '3.1 · Overview',
		module: 'module-3',
		moduleOrder: 3,
		order: 0,
		summary: 'What Module 3 builds: register, login, route guards, account + profile editor.'
	},
	{
		slug: 'module-3-register-and-login',
		href: '/course/modules/3/register-and-login',
		title: '3.2 · Register + login',
		module: 'module-3',
		moduleOrder: 3,
		order: 1,
		summary: 'Two route groups, email/password, GitHub OAuth, real Better Auth API calls, real errors.'
	},
	{
		slug: 'module-3-route-guards',
		href: '/course/modules/3/route-guards',
		title: '3.3 · Route guards + account',
		module: 'module-3',
		moduleOrder: 3,
		order: 2,
		summary: 'Gating authenticated pages, the account layout, and the profile editor on service + audit.'
	},
	{
		slug: 'module-3-sessions-and-signout',
		href: '/course/modules/3/sessions-and-signout',
		title: '3.4 · Sessions + sign-out',
		module: 'module-3',
		moduleOrder: 3,
		order: 3,
		summary: 'How Better Auth sessions work, cookie lifecycle, sign-out, and "remember me" sanity.'
	},
	{
		slug: 'module-4-overview',
		href: '/course/modules/4/overview',
		title: '4.1 · Overview',
		module: 'module-4',
		moduleOrder: 4,
		order: 0,
		summary: 'From auth to a first real feature: contacts / leads, end-to-end, service-layer all the way.'
	},
	{
		slug: 'module-4-schema-and-service',
		href: '/course/modules/4/schema-and-service',
		title: '4.2 · Schema + service',
		module: 'module-4',
		moduleOrder: 4,
		order: 1,
		summary: 'A Drizzle table for leads, a service that dedupes by email, and the public POST endpoint.'
	},
	{
		slug: 'module-4-admin-inbox',
		href: '/course/modules/4/admin-inbox',
		title: '4.3 · Admin inbox + unsubscribe',
		module: 'module-4',
		moduleOrder: 4,
		order: 2,
		summary: 'Paginated staff view, role-gated unsubscribe action, and every change audited.'
	}
];

const moduleMeta: Record<string, { order: number; title: string; summary: string }> = {
	'module-0': {
		order: 0,
		title: 'Before you start',
		summary: 'Tools, terminology, and the CLI reference you will return to.'
	},
	'module-1': {
		order: 1,
		title: 'Project setup',
		summary: 'SvelteKit repo, Neon dev branch, Better Auth, profiles, service-layer authorization.'
	},
	'module-2': {
		order: 2,
		title: 'SvelteKit + data layer',
		summary: 'Typed env, Drizzle client, server-only data access, load vs remote functions.'
	},
	'module-3': {
		order: 3,
		title: 'User auth',
		summary: 'Register, login, magic link, route guards, account page, 2FA, delete, export.'
	},
	'module-4': {
		order: 4,
		title: 'Contacts CRUD',
		summary: 'Drizzle schema, Superforms + Zod, modal polish, seed scripts, authorization.'
	},
	'module-5': {
		order: 5,
		title: 'Stripe fundamentals',
		summary: 'Dashboard, CLI, products, prices, lookup keys, cleanup.'
	},
	'module-6': {
		order: 6,
		title: 'Stripe + SvelteKit',
		summary: 'Node client, webhooks, stripe listen, what to mirror locally.'
	},
	'module-7': {
		order: 7,
		title: 'Billing services',
		summary: 'products, customers, subscriptions services — service-layer pattern.'
	},
	'module-8': {
		order: 8,
		title: 'Products + pricing page',
		summary: 'Config-driven pricing reading from Stripe, month↔year toggle, Save pill.'
	},
	'module-9': {
		order: 9,
		title: 'Pricing, checkout, billing',
		summary: 'Hosted Checkout, both trial flavors, test clocks, Customer Portal.'
	},
	'module-10': {
		order: 10,
		title: 'Tier-based access control',
		summary: 'validateTier, action restriction, UI limits, prevent multiple plans.'
	},
	'module-11': {
		order: 11,
		title: 'Testing',
		summary: 'Playwright + Vitest coverage for auth, CRUD, checkout.'
	},
	'module-12': {
		order: 12,
		title: 'CI/CD + production',
		summary: 'GitHub Actions, Neon branches, Vercel preview + prod, rollback.'
	},
	'module-13': {
		order: 13,
		title: 'UX extras',
		summary: 'Toasts, redirects, Stripe branding.'
	},
	'module-bonus': {
		order: 99,
		title: 'Bonus: custom multi-step checkout',
		summary: 'Tabbed Sign In → Billing → Payment + persistent cart + recurring totals.'
	}
};

export const coursePages = pages.sort((a, b) => {
	if (a.moduleOrder !== b.moduleOrder) return a.moduleOrder - b.moduleOrder;
	return a.order - b.order;
});

export const courseModules: CourseModule[] = Object.entries(moduleMeta)
	.map(([key, meta]) => ({
		key,
		...meta,
		pages: coursePages.filter((p) => p.module === key)
	}))
	.sort((a, b) => a.order - b.order);

export function findAdjacent(currentHref: string): { prev?: CoursePage; next?: CoursePage } {
	const idx = coursePages.findIndex((p) => p.href === currentHref);
	if (idx === -1) return {};
	return { prev: coursePages[idx - 1], next: coursePages[idx + 1] };
}

export function findBySlug(slug: string): CoursePage | undefined {
	return coursePages.find((p) => p.slug === slug);
}
