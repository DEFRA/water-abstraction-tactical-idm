/*
  https://eaflood.atlassian.net/browse/WATER-5464

  You need an account to access the service, and accounts can have different access permissions. You can also be
  disabled, have your permission type changed, plus the usual stuff around password resets, etc.

  This all needs to be managed somewhere by the service's admins. But, no doubt for time and resource reasons, that
  'where' was never built.

  You have to find existing users using the general search. You can create a user via a link on the **Manage** page. But
  there is no single place to view and manage accounts.

  We're about to start migrating some of the account functionality from the legacy apps to system. So, it seems an
  appropriate time to add a top-level accounts page to the service.

  We [added the new page in water-abstraction-system](https://github.com/DEFRA/water-abstraction-system/pull/2903), but
  encountered errors when first deployed to our `tst` environment. The investigation found that there were old user
  records which appear to have been seeded by the previous team that are no longer 'valid'.

  For example, they are set as `water_dev` users, but this is not a term either the legacy or current system recognises.
  When you attempt to view these users in the legacy view user page, they default to 'External' accounts.

  There is also a user setup with a group and roles, which do not exist in today's account management functionality.

  All these 'invalid' users are linked to the previous delivery team. So, this migration aims to clean up these invalid
  users to prevent any further issues when we start migrating account functionality.
*/

BEGIN TRANSACTION;

-- 1. This user was seeded as a member of the wirs group, but also with a user role of 'ar_approver'. In the current
-- service there is no mapping to a permission for a user with this type of setup, so both the legacy and current
-- system fail to handle it. The simplest fix is to delete the user role. The user will then be mapped as having
-- 'Waste and Industry Regulatory Service' permissions by the service.
DELETE FROM idm.user_roles ur
WHERE
  ur.user_id IN (
    SELECT
      u.user_id
    FROM
      idm.users u
    WHERE
      u.user_name = 'amrute.bendre@defra.gsi.gov.uk'
  );

-- 2. These users were seeded with an application of 'water_dev', which is not a valid type in either the legacy or
-- current system. Because some of these seeded users also have 'water_admin' records, we cannot update the type to that
-- due to a constraint on username and application (type).
-- If you attempt to view these users using the legacy service, its defaults them to 'External' accounts. For these
-- reasons, we are updating application on these invalid records to 'water_vml'.
UPDATE idm.users u
SET
  application = 'water_vml'
WHERE
  u.application = 'water_dev';

COMMIT;
