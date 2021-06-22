-- Remove the licence gauging station linkage role
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" = 'manage_gauging_station_licence_links'
);

-- Delete the billing accounts role
delete
from idm.roles
where application = 'water_admin' and "role" = 'manage_gauging_station_licence_links';
