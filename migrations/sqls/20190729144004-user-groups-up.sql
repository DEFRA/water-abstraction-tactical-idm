/* ensure function exists to generate GUID */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* create user roles table */
CREATE TABLE "idm"."user_roles" (
    "user_role_id" character varying NOT NULL,
    "user_id" integer NOT NULL,
    "role" character varying NOT NULL,
    PRIMARY KEY ("user_role_id"),
    CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE
);

/* create user groups table */
CREATE TABLE "idm"."user_groups" (
    "user_group_id" character varying NOT NULL,
    "user_id" integer NOT NULL,
    "group" character varying NOT NULL,
    PRIMARY KEY ("user_group_id"),
    CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE
);

/* create group roles table */
CREATE TABLE "idm"."group_roles" (
    "group_role_id" character varying NOT NULL,
    "group" character varying NOT NULL,
    "role" character varying NOT NULL,
    PRIMARY KEY ("group_role_id")
);

/* configure group roles */
INSERT INTO "idm"."group_roles" (group_role_id, "group", role) VALUES
  (gen_random_uuid(), 'environment_officer', 'hof_notifications'),
  (gen_random_uuid(), 'billing_and_data', 'returns'),
  (gen_random_uuid(), 'billing_and_data', 'bulk_return_notifications'),
  (gen_random_uuid(), 'billing_and_data', 'manage_accounts'),
  (gen_random_uuid(), 'billing_and_data', 'unlink_licences'),
  (gen_random_uuid(), 'wirs', 'returns'),
  (gen_random_uuid(), 'nps', 'renewal_notifications'),
  (gen_random_uuid(), 'nps', 'unlink_licences'),
  (gen_random_uuid(), 'psc', 'renewal_notifications'),
  (gen_random_uuid(), 'psc', 'unlink_licences'),
  (gen_random_uuid(), 'super', 'hof_notifications'),
  (gen_random_uuid(), 'super', 'returns'),
  (gen_random_uuid(), 'super', 'bulk_return_notifications'),
  (gen_random_uuid(), 'super', 'manage_accounts'),
  (gen_random_uuid(), 'super', 'unlink_licences'),
  (gen_random_uuid(), 'super', 'renewal_notifications'),
  (gen_random_uuid(), 'super', 'ar_user'),
  (gen_random_uuid(), 'super', 'ar_approver');

/* set up groups for existing internal water_admin users */
INSERT INTO "idm"."user_groups" (user_group_id, user_id, "group")
  SELECT gen_random_uuid(), u.user_id, g.group
  FROM idm.users u
  JOIN (
  	SELECT user_id,
  	CASE
  		WHEN (role->>'scopes')::jsonb ? 'returns' THEN 'wirs'
  		WHEN (role->>'scopes')::jsonb ? 'ar_user' THEN 'nps'
  		WHEN (role->>'scopes')::jsonb ? 'ar_approver' THEN 'nps'
  	END AS "group"
  	FROM idm.users u
  	WHERE u.application='water_admin'
  ) g ON u.user_id=g.user_id AND g.group IS NOT NULL;


  /* set up AR roles for existing internal water_admin users */
INSERT INTO "idm"."user_roles" (user_role_id, user_id, role)
  SELECT  gen_random_uuid(), u.user_id, r.role
  FROM idm.users u
  JOIN (
  	SELECT user_id,
  	CASE
  		WHEN (role->>'scopes')::jsonb ? 'ar_approver' THEN 'ar_approver'
  		WHEN (role->>'scopes')::jsonb ? 'ar_user' THEN 'ar_user'
  	END AS "role"
  	FROM idm.users u
  	WHERE u.application='water_admin'
  ) r ON u.user_id=r.user_id AND r.role IS NOT NULL;
