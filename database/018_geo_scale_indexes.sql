-- Search and queue indexes for growing GEO prompt and sample volumes.
CREATE INDEX ix_geo_prompts_question_trgm ON geo_prompts USING gin(prompt gin_trgm_ops);
CREATE INDEX ix_geo_prompts_brand_trgm ON geo_prompts USING gin(brand_name gin_trgm_ops);
CREATE INDEX ix_geo_monitor_targets_prompt ON geo_monitor_targets(prompt_id,created_at DESC);
CREATE INDEX ix_geo_sample_jobs_active_target ON geo_sample_jobs(target_id,created_at DESC) WHERE status IN ('pending','processing');
