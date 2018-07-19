-- Now that there is the concept of an 'application_name'
-- update the unique constraint to include the user_name
-- and the application so that a user can sign up to multiple
-- applications with the same user name, but never twice to the
-- same application.
alter table idm.users drop constraint if exists user_name_unique;

alter table idm.users
    add constraint user_name_unique unique (user_name, application);
