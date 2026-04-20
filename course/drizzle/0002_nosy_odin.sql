CREATE TABLE "account_deletion" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"executed_at" timestamp,
	"reason" text,
	CONSTRAINT "account_deletion_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "account_deletion" ADD CONSTRAINT "account_deletion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;