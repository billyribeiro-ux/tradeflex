import { json } from '@sveltejs/kit';
import { contactsService } from '$lib/server/services/contacts';
import { log } from '$lib/server/log';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	const ct = request.headers.get('content-type') ?? '';
	let email: string | undefined;
	let source = 'ebook';
	let name: string | undefined;

	try {
		if (ct.includes('application/json')) {
			const body = (await request.json()) as Record<string, unknown>;
			email = typeof body.email === 'string' ? body.email : undefined;
			if (typeof body.source === 'string') source = body.source;
			if (typeof body.name === 'string') name = body.name;
		} else {
			const fd = await request.formData();
			email = fd.get('email')?.toString();
			source = fd.get('source')?.toString() || source;
			name = fd.get('name')?.toString() || undefined;
		}
	} catch {
		return json({ message: 'Invalid body' }, { status: 400 });
	}

	if (!email) {
		return json({ message: 'Email required' }, { status: 400 });
	}

	try {
		const result = await contactsService.captureLead({
			email,
			source,
			name,
			metadata: { ip: getClientAddress(), userAgent: request.headers.get('user-agent') }
		});
		log.info('lead.captured', {
			requestId: locals.requestId,
			path: '/api/leads',
			...{ source, created: result.created }
		});
		return json({ ok: true, created: result.created });
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Failed';
		return json({ message: msg }, { status: 400 });
	}
};
