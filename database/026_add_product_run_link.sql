-- ai_writing_runs.saved_translation_id 的外键指向 content_item_translations（文章），
-- 无法存产品翻译 id。为 AI 产品生成补一个独立列，指向 product_translations。
ALTER TABLE ai_writing_runs ADD COLUMN IF NOT EXISTS saved_product_translation_id uuid REFERENCES product_translations(id) ON DELETE SET NULL;
