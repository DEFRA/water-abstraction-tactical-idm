-- Create an enum representing the applications that are
-- currently expected to use the IDM.
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

-- Now that there is the concept of an 'application_name'
-- update the unique constraint to include the user_name
-- and the application so that a user can sign up to multiple
-- applications with the same user name, but never twice to the
-- same application.
alter table idm.users drop constraint if exists user_name_unique;

alter table idm.users
    add constraint user_name_unique unique (user_name, application);
