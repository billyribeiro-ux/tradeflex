import { pgTable, serial, integer, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const profile = pgTable('profile', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	displayName: text('display_name'),
	bio: text('bio'),
	timezone: text('timezone').notNull().default('UTC'),
	avatarBlobKey: text('avatar_blob_key'),
	avatarShape: text('avatar_shape').notNull().default('circle'),
	notificationPrefs: jsonb('notification_prefs').notNull().default({}),
	theme: text('theme').notNull().default('system'),
	marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const roleAssignment = pgTable('role_assignment', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	role: text('role').notNull(),
	grantedAt: timestamp('granted_at').notNull().defaultNow(),
	grantedByUserId: text('granted_by_user_id')
});

export const auditEvent = pgTable('audit_event', {
	id: text('id').primaryKey(),
	actorUserId: text('actor_user_id'),
	impersonatorUserId: text('impersonator_user_id'),
	action: text('action').notNull(),
	targetKind: text('target_kind').notNull(),
	targetId: text('target_id'),
	metadata: jsonb('metadata').notNull().default({}),
	ipHash: text('ip_hash'),
	uaHash: text('ua_hash'),
	at: timestamp('at').notNull().defaultNow()
});

export const setting = pgTable('setting', {
	key: text('key').primaryKey(),
	valuePlain: text('value_plain'),
	valueCiphertext: text('value_ciphertext'),
	valueIv: text('value_iv'),
	valueAad: text('value_aad'),
	valueMask: text('value_mask'),
	encrypted: boolean('encrypted').notNull().default(false),
	version: integer('version').notNull().default(1),
	updatedByUserId: text('updated_by_user_id'),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const domainEvent = pgTable('domain_event', {
	id: text('id').primaryKey(),
	type: text('type').notNull(),
	actorUserId: text('actor_user_id'),
	payload: jsonb('payload').notNull().default({}),
	requestId: text('request_id'),
	at: timestamp('at').notNull().defaultNow()
});

export const webhookDelivery = pgTable('webhook_delivery', {
	id: text('id').primaryKey(),
	provider: text('provider').notNull(),
	eventId: text('event_id').notNull(),
	eventType: text('event_type').notNull(),
	payload: jsonb('payload').notNull().default({}),
	receivedAt: timestamp('received_at').notNull().defaultNow(),
	processedAt: timestamp('processed_at'),
	error: text('error')
});

export const contact = pgTable('contact', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	source: text('source').notNull(),
	name: text('name'),
	tags: jsonb('tags').notNull().default([]),
	optedIn: boolean('opted_in').notNull().default(true),
	unsubscribedAt: timestamp('unsubscribed_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	metadata: jsonb('metadata').notNull().default({})
});

export const alert = pgTable('alert', {
	id: text('id').primaryKey(),
	symbol: text('symbol').notNull(),
	kind: text('kind').notNull(),
	direction: text('direction').notNull(),
	thesis: text('thesis').notNull(),
	entry: text('entry'),
	stop: text('stop'),
	target: text('target'),
	sizingHint: text('sizing_hint'),
	status: text('status').notNull().default('published'),
	publishedByUserId: text('published_by_user_id'),
	publishedAt: timestamp('published_at').notNull().defaultNow(),
	closedAt: timestamp('closed_at'),
	outcome: text('outcome'),
	outcomeNote: text('outcome_note'),
	visibility: text('visibility').notNull().default('members')
});

export const customer = pgTable('customer', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const accountDeletion = pgTable('account_deletion', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
		.unique(),
	requestedAt: timestamp('requested_at').notNull().defaultNow(),
	scheduledFor: timestamp('scheduled_for').notNull(),
	cancelledAt: timestamp('cancelled_at'),
	executedAt: timestamp('executed_at'),
	reason: text('reason')
});

export const impersonation = pgTable('impersonation', {
	id: text('id').primaryKey(),
	impersonatorUserId: text('impersonator_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	targetUserId: text('target_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	reason: text('reason').notNull(),
	issuedAt: timestamp('issued_at').notNull().defaultNow(),
	expiresAt: timestamp('expires_at').notNull(),
	revokedAt: timestamp('revoked_at')
});

export const refundRequest = pgTable('refund_request', {
	id: text('id').primaryKey(),
	stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
	stripeChargeId: text('stripe_charge_id'),
	stripeCustomerId: text('stripe_customer_id'),
	subjectUserId: text('subject_user_id'),
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull(),
	reason: text('reason').notNull(),
	status: text('status').notNull().default('pending'),
	requestedByUserId: text('requested_by_user_id').notNull(),
	requestedAt: timestamp('requested_at').notNull().defaultNow(),
	decidedByUserId: text('decided_by_user_id'),
	decidedAt: timestamp('decided_at'),
	decisionNote: text('decision_note'),
	stripeRefundId: text('stripe_refund_id'),
	idempotencyKey: text('idempotency_key').notNull().unique()
});

export const featureFlag = pgTable('feature_flag', {
	key: text('key').primaryKey(),
	description: text('description').notNull().default(''),
	enabled: boolean('enabled').notNull().default(false),
	// Additive overrides beyond the global `enabled` flag.
	// If enabled=true, everyone gets it. If enabled=false, only users matching
	// enabledForRoles or enabledForUserIds get it. This mirrors how every
	// reasonable flag service (LaunchDarkly, GrowthBook, etc.) models staged
	// rollouts without needing a full targeting DSL.
	enabledForRoles: jsonb('enabled_for_roles').notNull().default([]),
	enabledForUserIds: jsonb('enabled_for_user_ids').notNull().default([]),
	updatedByUserId: text('updated_by_user_id'),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const subscription = pgTable('subscription', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	status: text('status').notNull(),
	priceLookupKey: text('price_lookup_key'),
	priceId: text('price_id'),
	currentPeriodEnd: timestamp('current_period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
	graceUntil: timestamp('grace_until'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const emailMessage = pgTable('email_message', {
	id: text('id').primaryKey(),
	direction: text('direction').notNull(),
	toAddress: text('to_address').notNull(),
	fromAddress: text('from_address').notNull(),
	subject: text('subject').notNull(),
	text: text('text').notNull(),
	html: text('html'),
	resendId: text('resend_id'),
	threadKey: text('thread_key').notNull(),
	sentByUserId: text('sent_by_user_id'),
	status: text('status').notNull(),
	errorReason: text('error_reason'),
	metadata: jsonb('metadata').notNull().default({}),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export * from './auth.schema';
