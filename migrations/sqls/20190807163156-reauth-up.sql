/* Replace with your SQL commands */

/* create reauth table */
CREATE TABLE IF NOT EXISTS "idm"."reauthentication" (
  "reauthentication_id" character varying NOT NULL,
  "user_id" integer NOT NULL,
  reference_date date DEFAULT NOW(),
  date_created timestamp without time zone DEFAULT now(),
  date_updated timestamp without time zone DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("reauthentication_id"),
  CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE,
  UNIQUE(user_id, reference_date)
);
