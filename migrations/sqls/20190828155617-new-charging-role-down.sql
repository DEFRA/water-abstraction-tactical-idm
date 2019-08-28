-- Remove the charging role from the groups
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" = 'charging'
);

-- Delete the charging role
delete
from idm.roles
where application = 'water_admin' and "role" = 'charging';
