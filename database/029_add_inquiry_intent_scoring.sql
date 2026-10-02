-- 买家意向评级（规则版）V1 · SPEC: docs/inquiry-intent-scoring-spec.md
--
-- 只扩 inquiries 六列：机器三件套（score / level / scored_at）+ 人工覆盖三件套
-- （override_level / override_by / override_at）。V1 不建历史评分表 —— 现在既没有
-- 历史评分数据，也没有自动评分链路，先建表只会扩大事务面、回滚面和 API 语义。
--
-- ⚠️ 六列一律 **nullable 且不设默认值**：NULL 必须保留「尚未评分」的语义。
--    写 DEFAULT 0 / DEFAULT 'observe' 会让历史行在迁移瞬间被解释成「机器已评过、结果为 0/observe」，
--    那是把「没数据」伪装成「有数据」，比空值更难发现。
--
-- ⚠️ 两组三字段必须整组同生同灭（要么全 NULL，要么全非 NULL），否则会出现
--    「有分数没有等级」「有覆盖等级却不知道谁改的」这类半截状态。
--
-- 计算与写入都在应用层（packages/domain/src/inquiry-intent.ts）：
-- 本迁移**不建触发器、不建自动打分任务**（D6 裁定：V1 仅后台手动重算）。
ALTER TABLE inquiries
  ADD COLUMN intent_score integer,
  ADD COLUMN intent_level text,
  ADD COLUMN intent_scored_at timestamptz,
  ADD COLUMN intent_override_level text,
  ADD COLUMN intent_override_by uuid,
  ADD COLUMN intent_override_at timestamptz;

ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_intent_score_range_ck
    CHECK (
      intent_score IS NULL
      OR intent_score BETWEEN 0 AND 100
    ),

  ADD CONSTRAINT inquiries_intent_level_ck
    CHECK (
      intent_level IS NULL
      OR intent_level IN ('hot', 'warm', 'cold', 'observe')
    ),

  ADD CONSTRAINT inquiries_intent_machine_consistency_ck
    CHECK (
      (
        intent_score IS NULL
        AND intent_level IS NULL
        AND intent_scored_at IS NULL
      )
      OR
      (
        intent_score IS NOT NULL
        AND intent_level IS NOT NULL
        AND intent_scored_at IS NOT NULL
      )
    ),

  ADD CONSTRAINT inquiries_intent_override_level_ck
    CHECK (
      intent_override_level IS NULL
      OR intent_override_level IN ('hot', 'warm', 'cold', 'observe')
    ),

  ADD CONSTRAINT inquiries_intent_override_consistency_ck
    CHECK (
      (
        intent_override_level IS NULL
        AND intent_override_by IS NULL
        AND intent_override_at IS NULL
      )
      OR
      (
        intent_override_level IS NOT NULL
        AND intent_override_by IS NOT NULL
        AND intent_override_at IS NOT NULL
      )
    ),

  ADD CONSTRAINT inquiries_intent_override_by_fk
    FOREIGN KEY (intent_override_by)
    REFERENCES users(id);
