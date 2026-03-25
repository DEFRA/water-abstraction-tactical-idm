/*
  https://eaflood.atlassian.net/browse/WATER-5552

  Following on from PR https://github.com/DEFRA/water-abstraction-ui/pull/2806 which fixed an issue where the users last
  login date was not being updated after a password reset. This migration will update the users last login date to the
  date of their most recent return submission for users whose last return submissions created date is at least 1 day
  after the last login date.
*/

DO $$
BEGIN
  IF EXISTS
    (
      SELECT
        1
      FROM
        information_schema.tables
      WHERE
        table_schema = 'returns'
        AND table_name = 'versions'
    )
  THEN
    WITH subquery AS (
      SELECT u.id, ls.last_return
      FROM idm.users u
      INNER JOIN (
        SELECT v.user_id, MAX(v.created_at) AS last_return
        FROM "returns".versions v
        GROUP BY v.user_id
      ) AS ls
        ON u.user_name = ls.user_id
      WHERE ls.last_return::date > u.last_login::date
    )
    UPDATE idm.users u
    SET
      last_login = s.last_return
    FROM
      subquery s
    WHERE
      u.id = s.id;
  END IF;
END
$$;
