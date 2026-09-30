-- 给 Payload cms_admin_users 的 role 枚举补 client 值。
-- Payload 的 select 字段在 Postgres 映射为 enum；生产 PAYLOAD_SCHEMA_PUSH=false 不会自动同步，
-- 而 AdminUsers.ts 的 options 已加 'client'，故需显式 ALTER TYPE 补值。
-- ADD VALUE IF NOT EXISTS 幂等（PG 12+）。
ALTER TYPE payload_internal.enum_cms_admin_users_role ADD VALUE IF NOT EXISTS 'client';
