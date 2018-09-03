-- Remove the application from the unique constraint.
alter table idm.users drop constraint if exists user_name_unique;
alter table idm.users
    add constraint user_name_unique unique (user_name);
