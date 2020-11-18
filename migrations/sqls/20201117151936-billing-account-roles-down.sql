-- Remove the billing accounts role from the groups
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" = 'manage_billing_accounts'
);

-- Delete the billing accounts role
delete
from idm.roles
where application = 'water_admin' and "role" = 'manage_billing_accounts';
