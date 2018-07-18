-- delete the view
drop view if exists "idm"."kpi_view";

-- now the type of user_data on the users table can be updated
alter table idm.users
alter column user_data type varchar;

-- now the view can be recreated
CREATE VIEW "idm"."kpi_view" AS
 SELECT (x.usertype || '_registrations_completed'::text) AS datapoint,
    count(*) AS value,
    (('Registrations completed post public beta for '::text || x.usertype) || ' users'::text) AS description
   FROM ( SELECT
                CASE
                    WHEN ((to_jsonb((users.user_data)::json) ->> 'usertype'::text) IS NOT NULL) THEN (to_jsonb((users.user_data)::json) ->> 'usertype'::text)
                    ELSE 'external'::text
                END AS usertype
           FROM idm.users
          WHERE ((users.last_login IS NOT NULL) AND (users.user_id > 113))) x
  GROUP BY (x.usertype || '_registrations_completed'::text), x.usertype
UNION
 SELECT (x.usertype || '_registrations_not_completed'::text) AS datapoint,
    count(*) AS value,
    (('Registrations started post public beta but not completed for '::text || x.usertype) || ' users'::text) AS description
   FROM ( SELECT
                CASE
                    WHEN ((to_jsonb((users.user_data)::json) ->> 'usertype'::text) IS NOT NULL) THEN (to_jsonb((users.user_data)::json) ->> 'usertype'::text)
                    ELSE 'external'::text
                END AS usertype
           FROM idm.users
          WHERE ((users.last_login IS NULL) AND (users.user_id > 113))) x
  GROUP BY (x.usertype || '_registrations_not_completed'::text), x.usertype
UNION
 SELECT (x.usertype || '_user_accounts'::text) AS datapoint,
    count(*) AS value,
    (('Total '::text || x.usertype) || '  post public beta user accounts'::text) AS description
   FROM ( SELECT
                CASE
                    WHEN ((to_jsonb((users.user_data)::json) ->> 'usertype'::text) IS NOT NULL) THEN (to_jsonb((users.user_data)::json) ->> 'usertype'::text)
                    ELSE 'external'::text
                END AS usertype
           FROM idm.users
          WHERE (users.user_id > 113)) x
  GROUP BY (x.usertype || '_user_accounts'::text), x.usertype
UNION
 SELECT 'total_user_accounts'::text AS datapoint,
    count(*) AS value,
    'Total post public beta user accounts'::text AS description
   FROM idm.users
  WHERE (users.user_id > 113)
  GROUP BY 'total_user_accounts'::text
