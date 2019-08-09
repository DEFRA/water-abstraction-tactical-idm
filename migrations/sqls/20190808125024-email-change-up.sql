/* Replace with your SQL commands */
DROP TABLE IF EXISTS "idm"."email_change_verification";

/* create reauth table */
CREATE TABLE IF NOT EXISTS "idm"."email_change" (
  "email_change_id" character varying NOT NULL,
  "user_id" integer NOT NULL,
  reference_date date DEFAULT NOW(),
  new_email_address character varying NOT NULL,
  security_code character varying NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  security_code_attempts integer NOT NULL DEFAULT 0,
  date_created timestamp without time zone DEFAULT now(),
  date_updated timestamp without time zone DEFAULT now(),
  date_verified timestamp without time zone DEFAULT null,
  PRIMARY KEY ("email_change_id"),
  CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE,
  UNIQUE(user_id, reference_date)
);
