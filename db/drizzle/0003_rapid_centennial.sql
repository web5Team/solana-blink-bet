ALTER TABLE "wagers" DROP CONSTRAINT "wagers_bet_id_bets_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wagers" ADD CONSTRAINT "wagers_bet_id_bets_id_fk" FOREIGN KEY ("bet_id") REFERENCES "public"."bets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bet_id_index" ON "wagers" USING btree ("bet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_addr_index" ON "wagers" USING btree ("user_address");