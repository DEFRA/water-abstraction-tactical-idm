-- Remove the agreements role from the groups
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" in ('manage_agreements', 'delete_agreements')
);

-- Delete the agreements roles
delete
from idm.roles
where application = 'water_admin' and "role" in ('manage_agreements', 'delete_agreements');
