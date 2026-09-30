-- Immutable, traceable reporting snapshots. Definitions describe fixed queries in packages/domain/src/bi.ts.
CREATE TABLE bi_metric_definitions (
 code text PRIMARY KEY,label text NOT NULL,unit text NOT NULL,formula text NOT NULL,
 source_tables text[] NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),
 is_enabled boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO bi_metric_definitions(code,label,unit,formula,source_tables) VALUES
('leads_received','收到询盘','count','在 UTC 日期范围内创建且未软删除的询盘数量。按内容语言分组。',ARRAY['inquiries']),
('leads_qualified_current','当前有效询盘','count','在范围内收到、当前状态为 qualified/replied/closed 的询盘数量；状态是生成报告时的快照。',ARRAY['inquiries']),
('opportunities_created','新增商机','count','在范围内创建且未软删除的商机数量，按创建时报告所见销售阶段分组。',ARRAY['crm_opportunities']),
('pipeline_open_current','当前开放商机','count','在范围内创建、报告生成时阶段未成交也未丢单的商机数量；按当前阶段分组。',ARRAY['crm_opportunities']),
('deals_won','成交商机','count','在范围内关闭且报告生成时处于 won 阶段的商机数量。',ARRAY['crm_opportunities']),
('won_amount','成交金额','money','成交商机的原币金额之和；每种币种单独分组，不做汇率换算。',ARRAY['crm_opportunities']),
('marketing_sent','营销发送','count','范围内发送接口确认接收的营销投递数；不代表最终到达收件箱。按活动分组。',ARRAY['marketing_deliveries']),
('marketing_optouts','营销退订','count','范围内由已同意变为退订的同意事件数。',ARRAY['marketing_consent_events']),
('geo_cost','GEO 模型估算成本','USD','范围内 GEO 采样按 token 单价估算的美元成本；按地区和模型分组。',ARRAY['geo_samples']),
('tasks_completed','完成跟进任务','count','范围内标记完成的 CRM 跟进任务数；按执行人分组。',ARRAY['crm_tasks']),
('publishes_completed','完成发布任务','count','范围内完成的静态发布任务数；按任务类型分组。',ARRAY['publish_jobs']);

CREATE TABLE bi_report_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 160),
 date_from date NOT NULL,date_to date NOT NULL CHECK(date_to>=date_from),timezone text NOT NULL DEFAULT 'UTC' CHECK(timezone='UTC'),
 definition_version integer NOT NULL DEFAULT 1,definitions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_by uuid REFERENCES users(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),
 source_rows integer NOT NULL DEFAULT 0 CHECK(source_rows>=0)
);
CREATE INDEX ix_bi_report_runs_time ON bi_report_runs(created_at DESC);
CREATE TABLE bi_report_values (
 report_id uuid NOT NULL REFERENCES bi_report_runs(id) ON DELETE CASCADE,
 metric_code text NOT NULL REFERENCES bi_metric_definitions(code),dimension text NOT NULL DEFAULT 'all',
 value numeric(22,6) NOT NULL,source_count integer NOT NULL CHECK(source_count>=0),
 PRIMARY KEY(report_id,metric_code,dimension)
);
CREATE TABLE bi_report_lineage (
 report_id uuid NOT NULL REFERENCES bi_report_runs(id) ON DELETE CASCADE,
 metric_code text NOT NULL REFERENCES bi_metric_definitions(code),
 source_table text NOT NULL,source_id uuid NOT NULL,dimension text NOT NULL DEFAULT 'all',
 item_label text NOT NULL,occurred_at timestamptz NOT NULL,value numeric(22,6) NOT NULL,
 PRIMARY KEY(report_id,metric_code,source_table,source_id)
);
CREATE INDEX ix_bi_lineage_drilldown ON bi_report_lineage(report_id,metric_code,dimension,occurred_at DESC);
