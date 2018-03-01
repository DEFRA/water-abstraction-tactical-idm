/*
 Navicat PostgreSQL Data Transfer

 Source Server         : local
 Source Server Type    : PostgreSQL
 Source Server Version : 90603
 Source Host           : localhost:5432
 Source Catalog        : permits
 Source Schema         : idm

 Target Server Type    : PostgreSQL
 Target Server Version : 90603
 File Encoding         : 65001

 Date: 01/12/2017 10:17:26
*/

set schema 'idm';

-- ----------------------------
-- Sequence structure for users_user_id_seq
-- ----------------------------
CREATE SEQUENCE if not exists "users_user_id_seq"
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 4
CACHE 1;



-- ----------------------------
-- Table structure for users
-- ----------------------------
CREATE TABLE if not exists "users" (
  "user_id" int4 NOT NULL DEFAULT nextval('idm.users_user_id_seq'::regclass),
  "user_name" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "password" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "admin" int8,
  "user_data" varchar COLLATE "pg_catalog"."default",
  "reset_guid" varchar COLLATE "pg_catalog"."default",
  "reset_required" int8,
  "last_login" date,
  "bad_logins" int8
)
;




-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"users_user_id_seq"', 5, false);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "users" drop CONSTRAINT if exists "users_pkey";
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "users" VALUES (9, '***REMOVED***', '$2a$10$dh/WkFg7f0EBnaP8723xXeU1mX2nUtx9fmi1few3VJwkNOjvuwD6K', 1, '{"firstname":"Dave"}', '8ddf47e2-333a-89dc-aa5a-802d2172fbe5', NULL, NULL, 0)  on conflict (user_id) do nothing;;
INSERT INTO "users" VALUES (10, '***REMOVED***', '$2a$10$cfknMPueleTEnSGX6wqhB.y6TinFjlFqrKUFqRhpjFXH9ZypdBHRe', 0, '{"firstname":"Dave"}', NULL, NULL, NULL, 0) on conflict (user_id) do nothing;;
COMMIT;
