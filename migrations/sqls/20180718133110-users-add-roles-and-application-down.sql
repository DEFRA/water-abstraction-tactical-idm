alter table idm.users
  drop column role;

alter table idm.users
  drop column application;

alter table idm.users
  drop column date_created;

alter table idm.users
  drop column date_updated;

drop type application_name;

-- Remove the application from the unique constraint.
alter table idm.users drop constraint if exists user_name_unique;
alter table idm.users
    add constraint user_name_unique unique (user_name)
