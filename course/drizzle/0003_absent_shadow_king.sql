CREATE TABLE "feature_flag" (
	"key" text PRIMARY KEY NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"enabled_for_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled_for_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
