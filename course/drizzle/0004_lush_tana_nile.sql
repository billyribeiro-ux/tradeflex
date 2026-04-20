CREATE TABLE "email_message" (
	"id" text PRIMARY KEY NOT NULL,
	"direction" text NOT NULL,
	"to_address" text NOT NULL,
	"from_address" text NOT NULL,
	"subject" text NOT NULL,
	"text" text NOT NULL,
	"html" text,
	"resend_id" text,
	"thread_key" text NOT NULL,
	"sent_by_user_id" text,
	"status" text NOT NULL,
	"error_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
