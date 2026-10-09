-- 030 回滚：删掉分类主图列与它的外键。
--
-- ⚠️ 不可逆的数据损失：DROP COLUMN 会一并丢掉所有分类已配好的主图关联（分类行、名称、路径、
--    排序都不受影响）。生产或任何已配图的库上执行前**必须**备份 taxonomy_terms（规范 §11）。
--    首选回退方式仍是**向前修**（再出 031）；本脚本只用于确需回退的场景。
--
-- 先删约束再删列：DROP COLUMN 本来也会连带删除该列上的约束，这里显式写出是为了让回滚脚本
-- 与正向迁移一一对应（评审时能逐条对上），并且当有人已经手工删过约束时，IF EXISTS 不会中断。
ALTER TABLE taxonomy_terms DROP CONSTRAINT IF EXISTS fk_terms_featured_media;

ALTER TABLE taxonomy_terms DROP COLUMN IF EXISTS featured_media_id;
