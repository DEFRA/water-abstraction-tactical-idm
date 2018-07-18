alter table idm.users
  drop column role;

alter table idm.users
  drop column application;

alter table idm.users
  drop column date_created;

alter table idm.users
  drop column date_updated;

drop type application_name;
