-- 029 回滚：把 inquiries 的意向评级六列整组删掉。
-- 六列都是本迁移新增、且没有其它表引用（只有 intent_override_by 的外键指向 users，
-- 随列一起删除），所以直接 DROP COLUMN 即可，不需要先回填数据。
--
-- ⚠️ 回滚会丢失已经算出的机器分与人工覆盖；这是不可逆的数据损失，
--    在生产和任何有真实询盘的库上执行前必须确认已备份。
ALTER TABLE inquiries
  DROP COLUMN IF EXISTS intent_override_at,
  DROP COLUMN IF EXISTS intent_override_by,
  DROP COLUMN IF EXISTS intent_override_level,
  DROP COLUMN IF EXISTS intent_scored_at,
  DROP COLUMN IF EXISTS intent_level,
  DROP COLUMN IF EXISTS intent_score;
