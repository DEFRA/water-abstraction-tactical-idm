ALTER TABLE "idm"."users" ADD COLUMN IF NOT EXISTS last_login date;

ALTER TABLE "idm"."users"
  ALTER COLUMN "last_login" TYPE timestamp(0) USING "last_login"::timestamp(0);
