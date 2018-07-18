drop type if exists idm.application_name;
create type idm.application_name as enum ('water_vml', 'water_admin');

alter table idm.users
  add column application idm.application_name;

alter table idm.users
  add column role jsonb;

alter table idm.users
  add column date_created timestamp;

alter table idm.users
  alter column date_created set default now();

alter table idm.users
  add column date_updated timestamp;

alter table idm.users
  alter column date_updated set default now();
