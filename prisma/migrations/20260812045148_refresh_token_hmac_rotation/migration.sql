-- Hard cutover: refresh-token storage moves from argon2 hash + unkeyed sha256
-- lookup key to a single keyed HMAC-SHA256 (REFRESH_TOKEN_HMAC_SECRET) column
-- that serves as both the DB lookup key and the verification value, plus
-- rotation/reuse-detection columns (previous_token_hash, rotated_at). Old
-- argon2 hashes cannot be converted to HMAC (one-way function), so all
-- existing sessions are invalidated here; every currently-logged-in user
-- must log in again after this deploys.
DELETE FROM "user_sessions";

-- DropIndex (unique indexes backing the old columns)
DROP INDEX "user_sessions_refresh_token_key";
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_lookup_key_key";

-- AlterTable: drop old dual-hash columns
ALTER TABLE "user_sessions" DROP COLUMN "refresh_token";
ALTER TABLE "user_sessions" DROP COLUMN "lookup_key";

-- AlterTable: add new HMAC + rotation columns
ALTER TABLE "user_sessions" ADD COLUMN "token_hash" TEXT NOT NULL;
ALTER TABLE "user_sessions" ADD COLUMN "previous_token_hash" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "rotated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");
CREATE UNIQUE INDEX "user_sessions_previous_token_hash_key" ON "user_sessions"("previous_token_hash");
