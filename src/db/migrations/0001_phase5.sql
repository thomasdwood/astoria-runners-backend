CREATE TABLE "hosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"user_id" integer,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "host_id" integer;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "meetup_url" varchar(500);
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "posted_to_meetup";
--> statement-breakpoint
ALTER TABLE "recurring_templates" ADD COLUMN "host_id" integer;
--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_templates" ADD CONSTRAINT "recurring_templates_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE set null ON UPDATE no action;
