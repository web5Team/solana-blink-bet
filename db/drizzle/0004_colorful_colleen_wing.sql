ALTER TABLE "bets" ADD COLUMN "scheduled_drawing_at" timestamp (3) with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" DROP COLUMN IF EXISTS "scheduled_drawing_block";