ALTER TABLE "idm"."users"
  ALTER COLUMN "last_login" TYPE timestamp(0) USING "last_login"::timestamp(0);
