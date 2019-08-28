/* ensure function exists to generate GUID */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* create roles table */
CREATE TABLE "idm"."roles" (
    "role_id" character varying NOT NULL,
    "application" idm.application_name,
    "role" character varying NOT NULL,
    "description" character varying NOT NULL,
    date_created timestamp without time zone DEFAULT now(),
    date_updated timestamp without time zone DEFAULT now(),
    PRIMARY KEY ("role_id"),
    UNIQUE(application, role)
);

/* create groups table */
CREATE TABLE "idm"."groups" (
    "group_id" character varying NOT NULL,
    "application" idm.application_name,
    "group" character varying NOT NULL,
    "description" character varying NOT NULL,
    date_created timestamp without time zone DEFAULT now(),
    date_updated timestamp without time zone DEFAULT now(),
    PRIMARY KEY ("group_id"),
    UNIQUE(application, "group")
);

/* create user roles table */
CREATE TABLE "idm"."user_roles" (
    "user_role_id" character varying NOT NULL,
    "user_id" integer NOT NULL,
    "role_id" character varying NOT NULL,
    date_created timestamp without time zone DEFAULT now(),
    date_updated timestamp without time zone DEFAULT now(),
    PRIMARY KEY ("user_role_id"),
    CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE,
    CONSTRAINT "role_id" FOREIGN KEY ("role_id") REFERENCES "idm"."roles"("role_id") ON DELETE CASCADE
);

/* create user groups table */
CREATE TABLE "idm"."user_groups" (
    "user_group_id" character varying NOT NULL,
    "user_id" integer NOT NULL,
    "group_id" character varying NOT NULL,
    date_created timestamp without time zone DEFAULT now(),
    date_updated timestamp without time zone DEFAULT now(),
    PRIMARY KEY ("user_group_id"),
    CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "idm"."users"("user_id") ON DELETE CASCADE,
    CONSTRAINT "group_id" FOREIGN KEY ("group_id") REFERENCES "idm"."groups"("group_id") ON DELETE CASCADE
);

/* create group roles table */
CREATE TABLE "idm"."group_roles" (
    "group_role_id" character varying NOT NULL,
    "group_id" character varying NOT NULL,
    "role_id" character varying NOT NULL,
    date_created timestamp without time zone DEFAULT now(),
    date_updated timestamp without time zone DEFAULT now(),
    PRIMARY KEY ("group_role_id"),
    UNIQUE(group_id, role_id),
    CONSTRAINT "role_id" FOREIGN KEY ("role_id") REFERENCES "idm"."roles"("role_id") ON DELETE CASCADE,
    CONSTRAINT "group_id" FOREIGN KEY ("group_id") REFERENCES "idm"."groups"("group_id") ON DELETE CASCADE
);

/* configure water_admin roles */
INSERT INTO "idm"."roles" (role_id, application, role, description) VALUES
  (gen_random_uuid(), 'water_admin', 'returns', 'Submit and edit returns'),
  (gen_random_uuid(), 'water_admin', 'hof_notifications', 'Send HoF notifications'),
  (gen_random_uuid(), 'water_admin', 'bulk_return_notifications', 'Send bulk return invitations and reminder notifications'),
  (gen_random_uuid(), 'water_admin', 'manage_accounts', 'Create and manage internal user accounts'),
  (gen_random_uuid(), 'water_admin', 'unlink_licences', 'Remove licences registered to a company'),
  (gen_random_uuid(), 'water_admin', 'renewal_notifications', 'Send renewal notifications'),
  (gen_random_uuid(), 'water_admin', 'ar_user', 'Edit licence data in Digitise! tool'),
  (gen_random_uuid(), 'water_admin', 'ar_approver', 'Approve licence data in Digitise! tool');

/* configure water_admin groups */
INSERT INTO "idm"."groups" (group_id, application, "group", description) VALUES
  (gen_random_uuid(), 'water_admin', 'environment_officer', 'Environment officer'),
  (gen_random_uuid(), 'water_admin', 'billing_and_data', 'Water Resources Billing & Data'),
  (gen_random_uuid(), 'water_admin', 'wirs', 'Waste Industry Regulatory Services'),
  (gen_random_uuid(), 'water_admin', 'nps', 'National Permitting Service'),
  (gen_random_uuid(), 'water_admin', 'psc', 'Permitting & Support Centre'),
  (gen_random_uuid(), 'water_admin', 'super', 'Super user');

/* configure group roles */
INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.role='hof_notifications' AND r.application=g.application
  WHERE g."group"='environment_officer' AND g.application='water_admin';

INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.role IN('returns', 'bulk_return_notifications', 'manage_accounts', 'unlink_licences') AND r.application=g.application
  WHERE g."group"='billing_and_data' AND g.application='water_admin';

INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.role='returns' AND r.application=g.application
  WHERE g."group"='wirs' AND g.application='water_admin';

INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.role IN('renewal_notifications', 'unlink_licences') AND r.application=g.application
  WHERE g."group"='nps' AND g.application='water_admin';

INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.role IN('renewal_notifications', 'unlink_licences') AND r.application=g.application
  WHERE g."group"='psc' AND g.application='water_admin';

INSERT INTO "idm"."group_roles" (group_role_id, group_id, role_id)
  SELECT gen_random_uuid(), g.group_id, r.role_id
  FROM idm.groups g
  JOIN idm.roles r ON r.application=g.application
  WHERE g."group"='super' AND g.application='water_admin';

/* set up groups for existing internal water_admin users */
INSERT INTO "idm"."user_groups" (user_group_id, user_id, group_id)
  SELECT gen_random_uuid(), u.user_id, g.group_id
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
    ) ug ON u.user_id=ug.user_id AND ug.group IS NOT NULL
    JOIN idm.groups g ON g.group=ug.group AND g.application='water_admin';

/* set up AR roles for existing internal water_admin users */
INSERT INTO "idm"."user_roles" (user_role_id, user_id, role_id)
  SELECT  gen_random_uuid(), u.user_id, r.role_id
  FROM idm.users u
  JOIN (
  	SELECT user_id,
  	CASE
  		WHEN (role->>'scopes')::jsonb ? 'ar_approver' THEN 'ar_approver'
  		WHEN (role->>'scopes')::jsonb ? 'ar_user' THEN 'ar_user'
  	END AS "role"
  	FROM idm.users u
  	WHERE u.application='water_admin'
  ) ur ON u.user_id=ur.user_id AND ur.role IS NOT NULL
  JOIN idm."roles" r ON ur.role=r.role AND r.application='water_admin';
