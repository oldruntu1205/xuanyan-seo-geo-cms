-- 分类主图（G2 / 规范 V1.0 §7.3）：taxonomy_terms 增加 featured_media_id，指向 media_assets。
--
-- 为什么必须新增列：taxonomy_terms 此前只有 id / taxonomy_id / parent_id / code / sort_order /
-- is_enabled / created_at / updated_at / deleted_at，**没有任何图片字段**，而运营要在后台给
-- 「产品分类」配图（首页与分类页的分类卡图位，卡图比例由皮肤决定：当前 .card-art 为 1:1）。
--
-- 为什么加在 taxonomy_terms 而不是 taxonomy_term_translations：图片与语言无关，分类名/描述才按语言
-- 存在译文表；这与 content_items / products 的既有做法完全同形（列在父表，装配层把它塞进
-- Document.media[0] 供渲染层使用）。
--
-- 为什么只有两条语句、不建索引：012 的注释写「每个外键都建索引」，但 013–029 都已经没有再补
-- ix_fk_* 索引（2026-10-09 实测：public 下 230 个外键中 68 个没有首列索引，属 030 之前的既成事实）。
-- 本迁移刻意不改这个现状 —— 「加一个图片字段」不应该被扩大成表级索引改造；taxonomy_terms 只有
-- 两位数行数，也没有性能动机。若将来要恢复该不变量，应单独出一个表级整理迁移，而不是混在这里。
--
-- 幂等性：本文件按 §2 的 migrate.mjs 语义**只应用一次**（schema_migrations 记录 sha256）；
-- 故意不写 IF NOT EXISTS —— 半幂等会掩盖「列已存在但类型/约束不对」这类真实漂移。
--
-- ON DELETE SET NULL：删除图片时分类保留、只是没有主图（与 006 给 content_items / products 的同类
-- 外键一致）；绝不允许因为删一张图而连带删掉分类。
ALTER TABLE taxonomy_terms ADD COLUMN featured_media_id uuid;

ALTER TABLE taxonomy_terms ADD CONSTRAINT fk_terms_featured_media
  FOREIGN KEY(featured_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
