update idm.users
set application = 'water_admin',
  date_updated = now()
where admin = 1;

update idm.users
set application = 'water_vml',
  date_updated = now()
where application is null;

alter table idm.users
  drop column admin;

