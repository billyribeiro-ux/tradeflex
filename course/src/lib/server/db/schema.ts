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

export * from './auth.schema';
