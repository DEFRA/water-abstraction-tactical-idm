/* Replace with your SQL commands */
ALTER TABLE idm.users DROP CONSTRAINT IF EXISTS user_name_unique;
ALTER TABLE idm.users
    ADD CONSTRAINT user_name_unique UNIQUE (user_name)
