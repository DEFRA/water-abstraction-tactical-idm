alter table idm.users
  alter column application type varchar;

drop type if exists idm.application_name;
create type idm.application_name as enum ('water_vml', 'water_admin', 'water_dev');

update idm.users
set application = 'water_dev', date_updated = now()
where application = 'water_admin';

update idm.users
set application = 'water_admin', date_updated = now()
where application = 'water_vml'
and (role->'scopes')::jsonb ? 'internal';

alter table idm.users
  alter column application type idm.application_name
    using (application::idm.application_name);
