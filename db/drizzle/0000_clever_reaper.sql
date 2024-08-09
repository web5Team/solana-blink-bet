DO $$ BEGIN
 CREATE TYPE "public"."bet_prediction" AS ENUM('odd', 'even');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bet_settle_status" AS ENUM('pending', 'success', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bet_token" AS ENUM('SOL', 'MUSHU');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."wager_settle_status" AS ENUM('pending', 'success', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dictionary" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	CONSTRAINT "dictionary_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp (3) with time zone NOT NULL,
	"closed_at" timestamp (3) with time zone,
	"scheduled_drawing_block" integer NOT NULL,
	"result" "bet_prediction",
	"status" "bet_settle_status" DEFAULT 'pending' NOT NULL,
	"funding_account" varchar,
	"settle_signature" varchar,
	"settle_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wagers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"bet_id" integer NOT NULL,
	"user_address" varchar NOT NULL,
	"prediction" "bet_prediction" NOT NULL,
	"amount" numeric(40, 0) NOT NULL,
	"token" "bet_token" NOT NULL,
	"block_number" integer NOT NULL,
	"signature" varchar NOT NULL,
	"status" "wager_settle_status" DEFAULT 'pending' NOT NULL,
	"profit" numeric(40, 0),
	"profit_signature" varchar,
	"settlement_error" text,
	CONSTRAINT "wagers_signature_unique" UNIQUE("signature")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wagers" ADD CONSTRAINT "wagers_bet_id_bets_id_fk" FOREIGN KEY ("bet_id") REFERENCES "public"."bets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
