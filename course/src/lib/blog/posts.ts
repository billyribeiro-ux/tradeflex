export interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	publishedAt: string;
	author: string;
	readingMinutes: number;
	tags: string[];
	body: string;
}

export const posts: BlogPost[] = [
	{
		slug: 'why-risk-first',
		title: 'Why every alert starts with the stop',
		excerpt:
			'The target is a question. The entry is a guess. The stop is the only number you control. Here is how we build alerts around it.',
		publishedAt: '2026-04-02',
		author: 'Billy',
		readingMinutes: 6,
		tags: ['risk', 'alerts'],
		body: `Most alert services lead with the target. "AAPL to 230, easy 5% win." We lead with the stop.

The reason is simple: the target is a question, the entry is a guess, and the stop is the only number you control. A setup with a clear invalidation ("below 178.40 we're wrong") is a trade. A setup without one is a narrative.

When we publish an alert, it carries four numbers in this order: **stop, entry, sizing, target**. That order is not cosmetic — it is how we want you to read it. Sizing answers "how much can I lose if the stop hits", and only then does the target matter.

Losing traders obsess over targets because winning feels good. Winning traders obsess over stops because losing is survivable when it's small. Trade Flex exists to make that second instinct easier to practice.`
	},
	{
		slug: 'alerts-are-not-signals',
		title: 'Alerts are not signals. Here is the difference.',
		excerpt:
			'A signal tells you what to buy. An alert tells you the setup you prepared for is live. One requires trust; the other requires preparation.',
		publishedAt: '2026-03-26',
		author: 'Billy',
		readingMinutes: 4,
		tags: ['education', 'alerts'],
		body: `A signal says: **"buy TSLA now."** An alert says: **"the TSLA breakout-from-base setup you studied last week just fired at 241.10, stop 237.80, invalidation daily close below 236."**

The first asks for trust. The second asks for preparation. We only publish the second kind.

Why it matters: if you can't teach your audience the pattern behind an alert, you've built a dependency, not a skill. We've seen too many services that only thrive when the market suits their one move. Trade Flex alerts are tagged by setup type, with a linked lesson in the course for each — so the alert is a recap, not a revelation.`
	},
	{
		slug: 'building-in-public',
		title: 'Building Trade Flex in public',
		excerpt:
			'We write the course as we build the platform. Every architectural decision is also a lesson. Here is why we think that is the right shape.',
		publishedAt: '2026-03-15',
		author: 'Billy',
		readingMinutes: 5,
		tags: ['meta', 'engineering'],
		body: `Trade Flex is two products in one repository: an alerts+education SaaS, and a course that teaches you how to build an alerts+education SaaS.

This isn't gimmick. Every real architectural decision in the product is more interesting than any toy example I could invent for a tutorial. The service-layer authorization pattern, the Stripe webhook dispatcher, the entitlement rule — those weren't built for the course. The course documents them because they're the right answer, and "the right answer with the war story attached" is the kind of teaching I wish I'd had.

If you want to follow along, the course sits at /course. New modules land as the product grows.`
	}
];

export function postBySlug(slug: string): BlogPost | undefined {
	return posts.find((p) => p.slug === slug);
}
