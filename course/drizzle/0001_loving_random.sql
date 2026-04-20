CREATE TABLE "impersonation" (
	"id" text PRIMARY KEY NOT NULL,
	"impersonator_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "impersonation" ADD CONSTRAINT "impersonation_impersonator_user_id_user_id_fk" FOREIGN KEY ("impersonator_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation" ADD CONSTRAINT "impersonation_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;