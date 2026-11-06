/*
This migration adds a new, simplified permissions column to the idm.users table.

This field will store a simple identifier for the user's permission level.
 */
ALTER TABLE idm.users
  ADD COLUMN IF NOT EXISTS permissions varchar;
