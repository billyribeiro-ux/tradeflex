import { describe, expect, test } from 'vitest';
import { extractTicketToken, ticketTokenFor } from './support';

describe('ticket token helpers', () => {
	test('ticketTokenFor returns TF- prefix with first 8 uppercased hex chars', () => {
		expect(ticketTokenFor('ab12cd34-ef56-7890-abcd-ef1234567890')).toBe('TF-AB12CD34');
	});

	test('extractTicketToken finds token in a Re: subject', () => {
		expect(extractTicketToken('Re: My password reset is broken [#TF-AB12CD34]')).toBe(
			'TF-AB12CD34'
		);
	});

	test('extractTicketToken is case-insensitive but returns uppercase', () => {
		expect(extractTicketToken('Re: help [#tf-ab12cd34]')).toBe('TF-AB12CD34');
	});

	test('extractTicketToken returns null when no token is present', () => {
		expect(extractTicketToken('Re: just a normal email')).toBeNull();
	});

	test('extractTicketToken ignores non-hex tokens', () => {
		expect(extractTicketToken('Re: help [#TF-ZZZZZZZZ]')).toBeNull();
	});

	test('roundtrip: extractTicketToken(subject(ticketTokenFor(id))) recovers the prefix', () => {
		const id = 'ab12cd34-ef56-7890-abcd-ef1234567890';
		const token = ticketTokenFor(id);
		const subject = `Re: Fix my login [#${token}]`;
		expect(extractTicketToken(subject)).toBe(token);
	});
});
