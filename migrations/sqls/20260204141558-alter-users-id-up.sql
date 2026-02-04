/*
 This migration adds an updated id colum to the idm users table

 The id will be used over the user_id column
 */

ALTER TABLE idm.users
  ADD COLUMN IF NOT EXISTS id UUID
  DEFAULT gen_random_uuid() NOT NULL;

ALTER TABLE idm.users
  ADD CONSTRAINT unique_users_id UNIQUE (id);
