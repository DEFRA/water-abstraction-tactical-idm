alter table idm.users
  add column admin bigint;

update idm.users
set admin = 1
where application = 'water_admin';
